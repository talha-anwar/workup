from datetime import datetime
import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy import CheckConstraint, UniqueConstraint, Date
from sqlalchemy.dialects.mysql import INTEGER as MySQLInteger

from database import Base


# -------- Enums --------
class UserRole(str, enum.Enum):
    client = "client"
    freelancer = "freelancer"
    both = "both"
    admin = "admin"


class UserStatus(str, enum.Enum):
    active = "active"
    suspended = "suspended"
    banned = "banned"


class ProjectStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class BidStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class ContractStatus(str, enum.Enum):
    active = "active"
    submitted = "submitted"
    completed = "completed"
    cancelled = "cancelled"


class ReportReason(str, enum.Enum):
    spam = "spam"
    fake_review = "fake_review"
    inappropriate_content = "inappropriate_content"
    payment_fraud = "payment_fraud"
    harassment = "harassment"
    other = "other"


class ReportStatus(str, enum.Enum):
    pending = "pending"
    reviewed = "reviewed"
    dismissed = "dismissed"


# -------- Association tables --------
freelancer_skills = Table(
    "freelancer_skills",
    Base.metadata,
    Column(
        "freelancer_id",
        MySQLInteger(unsigned=True),
        ForeignKey("freelancers.user_id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "skill_id",
        MySQLInteger(unsigned=True),
        ForeignKey("skills.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


project_skills = Table(
    "project_skills",
    Base.metadata,
    Column(
        "project_id",
        MySQLInteger(unsigned=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "skill_id",
        MySQLInteger(unsigned=True),
        ForeignKey("skills.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


# -------- Core models --------
class User(Base):
    __tablename__ = "users"

    id = Column(MySQLInteger(unsigned=True), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.active)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    freelancer_profile = relationship(
        "Freelancer", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    projects = relationship("Project", back_populates="client", cascade="all, delete-orphan")
    reviews_given = relationship(
        "Review",
        foreign_keys="Review.reviewer_id",
        back_populates="reviewer",
        cascade="all, delete-orphan",
    )
    reviews_received = relationship(
        "Review",
        foreign_keys="Review.reviewee_id",
        back_populates="reviewee",
        cascade="all, delete-orphan",
    )
    reports_made = relationship(
        "Report",
        foreign_keys="Report.reporter_id",
        back_populates="reporter",
        cascade="all, delete-orphan",
    )
    reports_received = relationship(
        "Report",
        foreign_keys="Report.reported_user_id",
        back_populates="reported_user",
        cascade="all, delete-orphan",
    )


class Freelancer(Base):
    __tablename__ = "freelancers"

    user_id = Column(
        MySQLInteger(unsigned=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    bio = Column(Text, nullable=True)
    hourly_rate = Column(Numeric(8, 2), nullable=False, default=0.00)

    user = relationship("User", back_populates="freelancer_profile")
    skills = relationship("Skill", secondary=freelancer_skills, back_populates="freelancers")
    bids = relationship("Bid", back_populates="freelancer", cascade="all, delete-orphan")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(MySQLInteger(unsigned=True), primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)

    freelancers = relationship("Freelancer", secondary=freelancer_skills, back_populates="skills")
    projects = relationship("Project", secondary=project_skills, back_populates="skills")


class Project(Base):
    __tablename__ = "projects"

    id = Column(MySQLInteger(unsigned=True), primary_key=True, index=True)
    client_id = Column(
        MySQLInteger(unsigned=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    budget_min = Column(Numeric(10, 2), nullable=False, default=0.00)
    budget_max = Column(Numeric(10, 2), nullable=False, default=0.00)
    status = Column(Enum(ProjectStatus), nullable=False, default=ProjectStatus.open)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    client = relationship("User", back_populates="projects")
    skills = relationship("Skill", secondary=project_skills, back_populates="projects")
    bids = relationship("Bid", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project")


class Bid(Base):
    __tablename__ = "bids"
    __table_args__ = (
        UniqueConstraint("project_id", "freelancer_id", name="uq_bids_project_freelancer"),
    )
    id = Column(MySQLInteger(unsigned=True), primary_key=True, index=True)
    project_id = Column(
        MySQLInteger(unsigned=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    freelancer_id = Column(
        MySQLInteger(unsigned=True),
        ForeignKey("freelancers.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount = Column(Numeric(10, 2), nullable=False)
    delivery_days = Column(MySQLInteger(unsigned=True), nullable=False)
    cover_letter = Column(Text, nullable=True)
    status = Column(Enum(BidStatus), nullable=False, default=BidStatus.pending)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    project = relationship("Project", back_populates="bids")
    freelancer = relationship("Freelancer", back_populates="bids")
    contract = relationship("Contract", back_populates="bid", uselist=False)


class Contract(Base):
    __tablename__ = "contracts"
    id = Column(MySQLInteger(unsigned=True), primary_key=True, index=True)
    bid_id = Column(
        MySQLInteger(unsigned=True),
        ForeignKey("bids.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,
    )
    agreed_amount = Column(Numeric(10, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    submission_message = Column(Text, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    status = Column(Enum(ContractStatus), nullable=False, default=ContractStatus.active)
    bid = relationship("Bid", back_populates="contract")
    reviews = relationship("Review", back_populates="contract", cascade="all, delete-orphan")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("contract_id", "reviewer_id", name="uq_reviews_contract_reviewer"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="chk_reviews_rating"),
    )
    id = Column(MySQLInteger(unsigned=True), primary_key=True, index=True)
    contract_id = Column(
        MySQLInteger(unsigned=True),
        ForeignKey("contracts.id", ondelete="CASCADE"),
        nullable=False,
    )
    reviewer_id = Column(
        MySQLInteger(unsigned=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    reviewee_id = Column(
        MySQLInteger(unsigned=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    rating = Column(MySQLInteger(unsigned=True), nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    contract = relationship("Contract", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    reviewee = relationship("User", foreign_keys=[reviewee_id], back_populates="reviews_received")
    reports = relationship("Report", back_populates="review")


class Report(Base):
    __tablename__ = "reports"
    id = Column(MySQLInteger(unsigned=True), primary_key=True, index=True)
    reporter_id = Column(
        MySQLInteger(unsigned=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    reported_user_id = Column(
        MySQLInteger(unsigned=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reason = Column(Enum(ReportReason), nullable=False)
    details = Column(Text, nullable=True)
    project_id = Column(
        MySQLInteger(unsigned=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
    )
    review_id = Column(
        MySQLInteger(unsigned=True),
        ForeignKey("reviews.id", ondelete="SET NULL"),
        nullable=True,
    )
    status = Column(Enum(ReportStatus), nullable=False, default=ReportStatus.pending, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reports_made")
    reported_user = relationship(
        "User", foreign_keys=[reported_user_id], back_populates="reports_received"
    )
    project = relationship("Project", back_populates="reports")
    review = relationship("Review", back_populates="reports")