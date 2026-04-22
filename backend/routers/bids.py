from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Bid, Project, Freelancer, Contract, BidStatus, ProjectStatus
from schemas import BidCreate, BidResponse
from dependencies import get_current_user, require_freelancer, require_client

router = APIRouter(tags=["bids"])


@router.get("/projects/{project_id}/bids", response_model=List[BidResponse])
def get_project_bids(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # only the project owner can see all bids
    if project.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your project")

    return project.bids


@router.post("/projects/{project_id}/bids", response_model=BidResponse, status_code=201)
def submit_bid(
    project_id: int,
    bid_data: BidCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_freelancer)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status != ProjectStatus.open:
        raise HTTPException(status_code=400, detail="Project is not open for bids")

    # check if freelancer already bid on this project
    existing = db.query(Bid).filter(
        Bid.project_id == project_id,
        Bid.freelancer_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already bid on this project")

    # make sure freelancer profile exists
    freelancer = db.query(Freelancer).filter(Freelancer.user_id == current_user.id).first()
    if not freelancer:
        raise HTTPException(status_code=400, detail="Freelancer profile not found")

    new_bid = Bid(
        project_id=project_id,
        freelancer_id=current_user.id,
        amount=bid_data.amount,
        delivery_days=bid_data.delivery_days,
        cover_letter=bid_data.cover_letter
    )
    db.add(new_bid)
    db.commit()
    db.refresh(new_bid)
    return new_bid


@router.patch("/bids/{bid_id}/status", response_model=BidResponse)
def update_bid_status(
    bid_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_client)
):
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    # only the project owner can accept or reject bids
    project = db.query(Project).filter(Project.id == bid.project_id).first()
    if project.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your project")

    new_status = status_update.get("status")

    # if accepting, make sure no other bid is already accepted
    if new_status == "accepted":
        already_accepted = db.query(Bid).filter(
            Bid.project_id == bid.project_id,
            Bid.status == BidStatus.accepted
        ).first()
        if already_accepted:
            raise HTTPException(status_code=400, detail="A bid is already accepted for this project")

        # create contract
        from models import Contract
        from datetime import date
        contract = Contract(
            bid_id=bid.id,
            agreed_amount=bid.amount,
            start_date=date.today()
        )
        db.add(contract)

        # update project status to in_progress
        project.status = ProjectStatus.in_progress

    bid.status = new_status
    db.commit()
    db.refresh(bid)
    return bid