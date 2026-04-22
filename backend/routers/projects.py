from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Project, Skill, User
from schemas import ProjectCreate, ProjectResponse, ProjectStatusUpdate
from dependencies import get_current_user, require_client

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    # public endpoint, no auth needed
    projects = db.query(Project).filter(Project.status == "open").all()
    return projects


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client)
):
    new_project = Project(
        client_id=current_user.id,
        title=project_data.title,
        description=project_data.description,
        budget_min=project_data.budget_min,
        budget_max=project_data.budget_max
    )
    db.add(new_project)
    db.flush()

    # attach skills if provided
    if project_data.skill_ids:
        skills = db.query(Skill).filter(Skill.id.in_(project_data.skill_ids)).all()
        new_project.skills = skills

    db.commit()
    db.refresh(new_project)
    return new_project


@router.patch("/{project_id}/status", response_model=ProjectResponse)
def update_project_status(
    project_id: int,
    status_update: ProjectStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    if project.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your project"
        )

    project.status = status_update.status
    db.commit()
    db.refresh(project)
    return project