# routers/reports.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Report, User
from schemas import ReportCreate, ReportResponse
from dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/", response_model=ReportResponse, status_code=201)
def file_report(
    report_data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # can't report yourself
    if report_data.reported_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot report yourself")

    # check reported user exists
    reported = db.query(User).filter(User.id == report_data.reported_user_id).first()
    if not reported:
        raise HTTPException(status_code=404, detail="Reported user not found")

    new_report = Report(
        reporter_id=current_user.id,
        reported_user_id=report_data.reported_user_id,
        reason=report_data.reason,
        details=report_data.details,
        project_id=report_data.project_id,
        review_id=report_data.review_id
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report


@router.get("/my", response_model=List[ReportResponse])
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reports = db.query(Report).filter(Report.reporter_id == current_user.id).all()
    return reports