from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Freelancer, Skill
from schemas import UserResponse, FreelancerCreate, FreelancerResponse
from dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


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
    current_user: User = Depends(get_current_user)
):
    # can only update your own profile
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Cannot edit another user's profile")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # only allow updating name for now
    if "name" in update_data:
        user.name = update_data["name"]

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # can only delete your own account
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Cannot delete another user's account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()


@router.get("/{user_id}/freelancer", response_model=FreelancerResponse)
def get_freelancer_profile(user_id: int, db: Session = Depends(get_db)):
    freelancer = db.query(Freelancer).filter(Freelancer.user_id == user_id).first()
    if not freelancer:
        raise HTTPException(status_code=404, detail="Freelancer profile not found")
    return freelancer


@router.patch("/{user_id}/freelancer", response_model=FreelancerResponse)
def update_freelancer_profile(
    user_id: int,
    profile_data: FreelancerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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

    db.commit()
    db.refresh(freelancer)
    return freelancer