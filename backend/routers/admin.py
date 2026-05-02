# routers/admin.py
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_admin
from models import (
    Contract,
    ContractStatus,
    Project,
    ProjectStatus,
    Report,
    ReportReason,
    ReportStatus,
    Review,
    User,
    UserRole,
    UserStatus,
)
from schemas import (
    AdminProjectList,
    AdminReportList,
    AdminStats,
    AdminUserList,
    AdminUserProfile,
    ProjectResponse,
    ProjectStatusUpdate,
    ReportResponse,
    ReportStatusUpdate,
    UserResponse,
    UserStatusUpdate,
)

router = APIRouter(prefix="/admin", tags=["admin"])
DEFAULT_LIMIT = 25
MAX_LIMIT = 100


def _safe_limit(limit: int) -> int:
    return max(1, min(limit, MAX_LIMIT))


@router.get("/users", response_model=AdminUserList)
def get_users(
    email: Optional[str] = Query(None, description="Search users by email/Gmail address"),
    role: Optional[UserRole] = Query(None),
    status_filter: Optional[UserStatus] = Query(None, alias="status"),
    limit: int = Query(DEFAULT_LIMIT, ge=1),
    offset: int = Query(0, ge=0),
    view_all: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = db.query(User)

    if email:
        query = query.filter(User.email.ilike(f"%{email.strip()}%"))
    if role:
        query = query.filter(User.role == role)
    if status_filter:
        query = query.filter(User.status == status_filter)

    total = query.count()
    query = query.order_by(User.created_at.desc(), User.id.desc())

    if view_all:
        users = query.all()
        response_limit = total
        response_offset = 0
    else:
        response_limit = _safe_limit(limit)
        response_offset = offset
        users = query.offset(response_offset).limit(response_limit).all()

    return AdminUserList(
        items=users,
        total=total,
        limit=response_limit,
        offset=response_offset,
    )


@router.get("/users/{user_id}/profile", response_model=AdminUserProfile)
def get_user_profile_for_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    active_reports_count = (
        db.query(func.count(Report.id))
        .filter(Report.reported_user_id == user_id, Report.status == ReportStatus.pending)
        .scalar()
    )
    reports = (
        db.query(Report)
        .filter(Report.reported_user_id == user_id)
        .order_by(case((Report.status == ReportStatus.pending, 0), else_=1), Report.created_at.desc(), Report.id.desc())
        .all()
    )

    return AdminUserProfile(
        user=user,
        active_reports_count=active_reports_count or 0,
        reports=reports,
    )


@router.patch("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot modify another admin")

    user.status = status_update.status
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_405_METHOD_NOT_ALLOWED)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    raise HTTPException(
        status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
        detail="User records are retained. Suspend or ban the user instead of deleting the profile.",
    )


@router.get("/projects", response_model=AdminProjectList)
def get_projects(
    title: Optional[str] = Query(None, description="Search projects by title"),
    status_filter: Optional[ProjectStatus] = Query(None, alias="status"),
    limit: int = Query(DEFAULT_LIMIT, ge=1),
    offset: int = Query(0, ge=0),
    view_all: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = db.query(Project)

    if title:
        query = query.filter(Project.title.ilike(f"%{title.strip()}%"))
    if status_filter:
        query = query.filter(Project.status == status_filter)

    total = query.count()
    query = query.order_by(Project.created_at.desc(), Project.id.desc())

    if view_all:
        projects = query.all()
        response_limit = total
        response_offset = 0
    else:
        response_limit = _safe_limit(limit)
        response_offset = offset
        projects = query.offset(response_offset).limit(response_limit).all()

    return AdminProjectList(
        items=projects,
        total=total,
        limit=response_limit,
        offset=response_offset,
    )


@router.patch("/projects/{project_id}/status", response_model=ProjectResponse)
def force_project_status(
    project_id: int,
    status_update: ProjectStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if status_update.status != ProjectStatus.cancelled:
        raise HTTPException(status_code=400, detail="Admins can only cancel projects.")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.status = ProjectStatus.cancelled
    db.commit()
    db.refresh(project)
    return project


@router.delete("/reviews/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    db.delete(review)
    db.commit()


@router.get("/reports", response_model=AdminReportList)
def get_reports(
    status_filter: Optional[ReportStatus] = Query(None, alias="status"),
    reason: Optional[ReportReason] = Query(None),
    reported_user_id: Optional[int] = Query(None),
    limit: int = Query(DEFAULT_LIMIT, ge=1),
    offset: int = Query(0, ge=0),
    view_all: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = db.query(Report)

    if status_filter:
        query = query.filter(Report.status == status_filter)
    if reason:
        query = query.filter(Report.reason == reason)
    if reported_user_id:
        query = query.filter(Report.reported_user_id == reported_user_id)

    total = query.count()
    query = query.order_by(Report.created_at.desc(), Report.id.desc())

    if view_all:
        reports = query.all()
        response_limit = total
        response_offset = 0
    else:
        response_limit = _safe_limit(limit)
        response_offset = offset
        reports = query.offset(response_offset).limit(response_limit).all()

    return AdminReportList(
        items=reports,
        total=total,
        limit=response_limit,
        offset=response_offset,
    )


@router.patch("/reports/{report_id}/status", response_model=ReportResponse)
def update_report_status(
    report_id: int,
    status_update: ReportStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = status_update.status
    db.commit()
    db.refresh(report)
    return report


@router.get("/stats", response_model=AdminStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    total_users = db.query(func.count(User.id)).scalar()
    total_projects = db.query(func.count(Project.id)).scalar()
    active_contracts = (
        db.query(func.count(Contract.id))
        .filter(Contract.status.in_([ContractStatus.active, ContractStatus.submitted]))
        .scalar()
    )
    avg_rating = db.query(func.avg(Review.rating)).scalar()
    pending_reports = (
        db.query(func.count(Report.id))
        .filter(Report.status == ReportStatus.pending)
        .scalar()
    )

    return AdminStats(
        total_users=total_users,
        total_projects=total_projects,
        active_contracts=active_contracts,
        platform_avg_rating=round(float(avg_rating), 2) if avg_rating else None,
        total_reports_pending=pending_reports,
    )
