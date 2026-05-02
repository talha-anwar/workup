from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Contract, ContractStatus, ProjectStatus
from schemas import ContractResponse, ContractSubmit
from dependencies import get_current_user

router = APIRouter(prefix="/contracts", tags=["contracts"])


def get_visible_contract(contract_id: int, db: Session, current_user):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    client_id = contract.bid.project.client_id
    freelancer_id = contract.bid.freelancer_id

    if current_user.id not in (client_id, freelancer_id):
        raise HTTPException(status_code=403, detail="Not your contract")

    return contract


@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_visible_contract(contract_id, db, current_user)


@router.patch("/{contract_id}/submit", response_model=ContractResponse)
def submit_contract_work(
    contract_id: int,
    submission: ContractSubmit,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    contract = get_visible_contract(contract_id, db, current_user)

    if current_user.id != contract.bid.freelancer_id:
        raise HTTPException(status_code=403, detail="Only the accepted freelancer can submit work")

    if contract.status != ContractStatus.active:
        raise HTTPException(status_code=400, detail="Only active contracts can be submitted")

    message = submission.submission_message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Submission message is required")

    contract.submission_message = message
    contract.submitted_at = datetime.utcnow()
    contract.status = ContractStatus.submitted

    db.commit()
    db.refresh(contract)
    return contract


@router.patch("/{contract_id}/complete", response_model=ContractResponse)
def complete_contract_work(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    contract = get_visible_contract(contract_id, db, current_user)

    if current_user.id != contract.bid.project.client_id:
        raise HTTPException(status_code=403, detail="Only the client can complete this contract")

    if contract.status != ContractStatus.submitted:
        raise HTTPException(status_code=400, detail="The freelancer must submit work before completion")

    contract.status = ContractStatus.completed
    contract.bid.project.status = ProjectStatus.completed

    db.commit()
    db.refresh(contract)
    return contract
