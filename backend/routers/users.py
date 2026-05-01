from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Freelancer, Skill, Project, Bid, Contract, ContractStatus
from schemas import (
    UserResponse,
    FreelancerResponse,
    FreelancerUpdate,
    ProjectResponse,
    BidResponse,
    ContractResponse,
    ProfileStatsResponse,
)
from dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me/projects", response_model=List[ProjectResponse])
def get_my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Project)
        .filter(Project.client_id == current_user.id)
        .order_by(Project.created_at.desc(), Project.id.desc())
        .all()
    )


@router.get("/me/bids", response_model=List[BidResponse])
def get_my_bids(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Bid)
        .filter(Bid.freelancer_id == current_user.id)
        .order_by(Bid.created_at.desc(), Bid.id.desc())
        .all()
    )


@router.get("/me/contracts", response_model=List[ContractResponse])
def get_my_contracts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Contract)
        .join(Contract.bid)
        .join(Bid.project)
        .filter(
            or_(
                Bid.freelancer_id == current_user.id,
                Project.client_id == current_user.id,
            )
        )
        .order_by(Contract.start_date.desc(), Contract.id.desc())
        .distinct()
        .all()
    )


@router.get("/{user_id}/stats", response_model=ProfileStatsResponse)
def get_user_profile_stats(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    completed_projects = (
        db.query(Project)
        .join(Bid, Bid.project_id == Project.id)
        .join(Contract, Contract.bid_id == Bid.id)
        .filter(Bid.freelancer_id == user_id, Contract.status == ContractStatus.completed)
        .order_by(Project.created_at.desc(), Project.id.desc())
        .all()
    )

    posted_projects = (
        db.query(Project)
        .filter(Project.client_id == user_id)
        .order_by(Project.created_at.desc(), Project.id.desc())
        .all()
    )

    return ProfileStatsResponse(
        completed_projects_count=len(completed_projects),
        posted_projects_count=len(posted_projects),
        completed_projects=completed_projects,
        posted_projects=posted_projects,
    )


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    update_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Cannot edit another user's profile")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "name" in update_data:
        user.name = update_data["name"]

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=405)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    raise HTTPException(
        status_code=405,
        detail="User records are retained. Accounts can be suspended or banned, but profiles are not deleted from the database.",
    )


@router.get("/{user_id}/freelancer", response_model=FreelancerResponse)
def get_freelancer_profile(user_id: int, db: Session = Depends(get_db)):
    freelancer = db.query(Freelancer).filter(Freelancer.user_id == user_id).first()
    if not freelancer:
        raise HTTPException(status_code=404, detail="Freelancer profile not found")
    return freelancer


@router.patch("/{user_id}/freelancer", response_model=FreelancerResponse)
def update_freelancer_profile(
    user_id: int,
    profile_data: FreelancerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Cannot edit another user's profile")

    freelancer = db.query(Freelancer).filter(Freelancer.user_id == user_id).first()
    if not freelancer:
        raise HTTPException(status_code=404, detail="Freelancer profile not found")

    if profile_data.bio is not None:
        freelancer.bio = profile_data.bio
    if profile_data.hourly_rate is not None:
        freelancer.hourly_rate = profile_data.hourly_rate
    if profile_data.skill_ids is not None:
        if profile_data.skill_ids:
            skills = db.query(Skill).filter(Skill.id.in_(profile_data.skill_ids)).all()
        else:
            skills = []
        freelancer.skills = skills

    db.commit()
    db.refresh(freelancer)
    return freelancer
