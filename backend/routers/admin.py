# routers/admin.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from database import get_db
from models import User, Project, Contract, Review, Report, ContractStatus, ReportStatus
from schemas import (
    UserResponse, ProjectResponse, ReportResponse,
    UserStatusUpdate, ReportStatusUpdate, AdminStats
)
from dependencies import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    return db.query(User).all()


@router.patch("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role.value == "admin":
        raise HTTPException(status_code=400, detail="Cannot modify another admin")

    user.status = status_update.status
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role.value == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete an admin")

    db.delete(user)
    db.commit()


@router.get("/projects", response_model=List[ProjectResponse])
def get_all_projects(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    return db.query(Project).all()


@router.patch("/projects/{project_id}/status", response_model=ProjectResponse)
def force_project_status(
    project_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.status = status_update.get("status")
    db.commit()
    db.refresh(project)
    return project


@router.delete("/reviews/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    db.delete(review)
    db.commit()


@router.get("/reports", response_model=List[ReportResponse])
def get_all_reports(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    return db.query(Report).all()


@router.patch("/reports/{report_id}/status", response_model=ReportResponse)
def update_report_status(
    report_id: int,
    status_update: ReportStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
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
    current_user=Depends(require_admin)
):
    total_users = db.query(func.count(User.id)).scalar()
    total_projects = db.query(func.count(Project.id)).scalar()
    active_contracts = db.query(func.count(Contract.id)).filter(
        Contract.status == ContractStatus.active
    ).scalar()
    avg_rating = db.query(func.avg(Review.rating)).scalar()
    pending_reports = db.query(func.count(Report.id)).filter(
        Report.status == ReportStatus.pending
    ).scalar()

    return AdminStats(
        total_users=total_users,
        total_projects=total_projects,
        active_contracts=active_contracts,
        platform_avg_rating=round(float(avg_rating), 2) if avg_rating else None,
        total_reports_pending=pending_reports
    )