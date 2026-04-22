from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from models import UserRole, UserStatus, ProjectStatus, BidStatus, ContractStatus, ReportReason, ReportStatus


# -------- User --------
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    status: UserStatus
    created_at: datetime

    class Config:
        from_attributes = True


# -------- Freelancer --------
class FreelancerBase(BaseModel):
    bio: Optional[str] = None
    hourly_rate: float

class FreelancerCreate(FreelancerBase):
    pass

class FreelancerResponse(FreelancerBase):
    user_id: int
    user: UserResponse

    class Config:
        from_attributes = True


# -------- Skill --------
class SkillResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


# -------- Project --------
class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    budget_min: float
    budget_max: float

class ProjectCreate(ProjectBase):
    skill_ids: Optional[List[int]] = []

class ProjectResponse(ProjectBase):
    id: int
    client_id: int
    status: ProjectStatus
    created_at: datetime
    client: UserResponse
    skills: List[SkillResponse] = []

    class Config:
        from_attributes = True


# -------- Bid --------
class BidBase(BaseModel):
    amount: float
    delivery_days: int
    cover_letter: Optional[str] = None

class BidCreate(BidBase):
    pass

class BidResponse(BidBase):
    id: int
    project_id: int
    freelancer_id: int
    status: BidStatus
    created_at: datetime
    freelancer: FreelancerResponse

    class Config:
        from_attributes = True


# -------- Contract --------
class ContractBase(BaseModel):
    agreed_amount: float
    start_date: date

class ContractResponse(ContractBase):
    id: int
    bid_id: int
    status: ContractStatus
    bid: BidResponse

    class Config:
        from_attributes = True


# -------- Review --------
class ReviewBase(BaseModel):
    rating: int
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    reviewee_id: int

class ReviewResponse(ReviewBase):
    id: int
    contract_id: int
    reviewer_id: int
    reviewee_id: int
    created_at: datetime
    reviewer: UserResponse

    class Config:
        from_attributes = True


# -------- Report --------
class ReportBase(BaseModel):
    reported_user_id: int
    reason: ReportReason
    details: Optional[str] = None
    project_id: Optional[int] = None
    review_id: Optional[int] = None

class ReportCreate(ReportBase):
    pass

class ReportResponse(ReportBase):
    id: int
    reporter_id: int
    status: ReportStatus
    created_at: datetime
    reporter: UserResponse
    reported_user: UserResponse

    class Config:
        from_attributes = True


# -------- Admin --------
class UserStatusUpdate(BaseModel):
    status: UserStatus

class ReportStatusUpdate(BaseModel):
    status: ReportStatus

class AdminStats(BaseModel):
    total_users: int
    total_projects: int
    active_contracts: int
    platform_avg_rating: Optional[float]
    total_reports_pending: int


# -------- Auth --------
class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str