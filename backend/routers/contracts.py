# routers/contracts.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Contract
from schemas import ContractResponse
from dependencies import get_current_user

router = APIRouter(prefix="/contracts", tags=["contracts"])


@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    # only the client or freelancer involved can view the contract
    client_id = contract.bid.project.client_id
    freelancer_id = contract.bid.freelancer_id

    if current_user.id not in (client_id, freelancer_id):
        raise HTTPException(status_code=403, detail="Not your contract")

    return contract