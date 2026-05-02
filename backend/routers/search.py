from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Project, Freelancer, Skill, ProjectStatus
from schemas import ProjectResponse, FreelancerResponse

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/projects", response_model=List[ProjectResponse])
def search_projects(
    skill: Optional[str] = Query(None),
    budget_min: Optional[float] = Query(None),
    budget_max: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Project).filter(Project.status == ProjectStatus.open)

    if skill:
        query = query.join(Project.skills).filter(Skill.name.ilike(f"%{skill}%"))

    # User-facing filters mean: only show projects whose own minimum budget
    # is at least the selected minimum, and whose own maximum budget is not
    # above the selected maximum.
    if budget_min is not None:
        query = query.filter(Project.budget_min >= budget_min)

    if budget_max is not None:
        query = query.filter(Project.budget_max <= budget_max)

    return query.distinct().all()


@router.get("/freelancers", response_model=List[FreelancerResponse])
def search_freelancers(
    skill: Optional[str] = Query(None),
    min_rate: Optional[float] = Query(None),
    max_rate: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Freelancer)

    if skill:
        query = query.join(Freelancer.skills).filter(Skill.name.ilike(f"%{skill}%"))

    if min_rate is not None:
        query = query.filter(Freelancer.hourly_rate >= min_rate)

    if max_rate is not None:
        query = query.filter(Freelancer.hourly_rate <= max_rate)

    return query.distinct().all()
