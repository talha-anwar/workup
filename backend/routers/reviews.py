from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Contract, Review, ContractStatus
from schemas import ReviewCreate, ReviewResponse
from dependencies import get_current_user

router = APIRouter(tags=["reviews"])


@router.post("/contracts/{contract_id}/reviews", response_model=ReviewResponse, status_code=201)
def create_review(
    contract_id: int,
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    if contract.status != ContractStatus.completed:
        raise HTTPException(status_code=400, detail="Contract is not completed yet")

    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    client_id = contract.bid.project.client_id
    freelancer_id = contract.bid.freelancer_id

    if current_user.id not in (client_id, freelancer_id):
        raise HTTPException(status_code=403, detail="Not your contract")

    existing = db.query(Review).filter(
        Review.contract_id == contract_id,
        Review.reviewer_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this contract")

    reviewee_id = freelancer_id if current_user.id == client_id else client_id
    if review_data.reviewee_id != reviewee_id:
        raise HTTPException(status_code=400, detail="Invalid reviewee")

    new_review = Review(
        contract_id=contract_id,
        reviewer_id=current_user.id,
        reviewee_id=reviewee_id,
        rating=review_data.rating,
        comment=review_data.comment,
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review


@router.get("/users/{user_id}/reviews", response_model=List[ReviewResponse])
def get_user_reviews(user_id: int, db: Session = Depends(get_db)):
    return db.query(Review).filter(Review.reviewee_id == user_id).all()
