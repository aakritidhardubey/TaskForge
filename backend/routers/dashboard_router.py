from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=schemas.DashboardStats)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # Get all projects user is part of
    memberships = (
        db.query(models.ProjectMember)
        .filter(models.ProjectMember.user_id == current_user.id)
        .all()
    )
    project_ids = [m.project_id for m in memberships]

    # All tasks across user's projects
    all_tasks = (
        db.query(models.Task)
        .filter(models.Task.project_id.in_(project_ids))
        .all()
        if project_ids else []
    )

    now = datetime.utcnow()
    tasks_by_status = {
        "todo": 0,
        "in_progress": 0,
        "review": 0,
        "done": 0,
    }
    overdue = 0
    for task in all_tasks:
        tasks_by_status[task.status.value] += 1
        if task.due_date and task.due_date < now and task.status != models.StatusEnum.done:
            overdue += 1

    my_assigned = sum(1 for t in all_tasks if t.assignee_id == current_user.id)

    recent_tasks = (
        db.query(models.Task)
        .filter(models.Task.project_id.in_(project_ids))
        .order_by(models.Task.created_at.desc())
        .limit(5)
        .all()
        if project_ids else []
    )

    return schemas.DashboardStats(
        total_projects=len(project_ids),
        total_tasks=len(all_tasks),
        tasks_by_status=tasks_by_status,
        overdue_tasks=overdue,
        my_assigned_tasks=my_assigned,
        recent_tasks=recent_tasks,
    )
