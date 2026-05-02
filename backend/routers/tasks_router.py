from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/projects/{project_id}/tasks", tags=["tasks"])


@router.post("", response_model=schemas.TaskOut, status_code=201)
def create_task(
    project_id: int,
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    auth.get_project_member(project_id, current_user, db)

    # Validate assignee is a member
    if payload.assignee_id:
        assignee_member = (
            db.query(models.ProjectMember)
            .filter(
                models.ProjectMember.project_id == project_id,
                models.ProjectMember.user_id == payload.assignee_id,
            )
            .first()
        )
        if not assignee_member:
            raise HTTPException(status_code=400, detail="Assignee must be a project member")

    task = models.Task(
        title=payload.title,
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        due_date=payload.due_date,
        project_id=project_id,
        assignee_id=payload.assignee_id,
        creator_id=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("", response_model=List[schemas.TaskOut])
def list_tasks(
    project_id: int,
    status: Optional[models.StatusEnum] = Query(None),
    priority: Optional[models.PriorityEnum] = Query(None),
    assignee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    auth.get_project_member(project_id, current_user, db)
    query = db.query(models.Task).filter(models.Task.project_id == project_id)
    if status:
        query = query.filter(models.Task.status == status)
    if priority:
        query = query.filter(models.Task.priority == priority)
    if assignee_id:
        query = query.filter(models.Task.assignee_id == assignee_id)
    return query.order_by(models.Task.created_at.desc()).all()


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    auth.get_project_member(project_id, current_user, db)
    task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id, models.Task.project_id == project_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    project_id: int,
    task_id: int,
    payload: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    member = auth.get_project_member(project_id, current_user, db)
    task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id, models.Task.project_id == project_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Members can only update tasks they created or are assigned to
    if member.role != models.RoleEnum.admin:
        if task.creator_id != current_user.id and task.assignee_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only update tasks you created or are assigned to")

    if payload.assignee_id is not None:
        if payload.assignee_id != 0:
            assignee_member = (
                db.query(models.ProjectMember)
                .filter(
                    models.ProjectMember.project_id == project_id,
                    models.ProjectMember.user_id == payload.assignee_id,
                )
                .first()
            )
            if not assignee_member:
                raise HTTPException(status_code=400, detail="Assignee must be a project member")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    member = auth.get_project_member(project_id, current_user, db)
    task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id, models.Task.project_id == project_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if member.role != models.RoleEnum.admin and task.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only admins or task creators can delete tasks")

    db.delete(task)
    db.commit()
