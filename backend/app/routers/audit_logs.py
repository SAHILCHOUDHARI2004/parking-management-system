from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.dependencies import get_db, require_security
from app.models.audit_log import AuditLog
from app.models.booking import Booking
from app.models.employee import Employee
from app.models.user import User
from app.schemas.audit_log import AuditLogPaginated

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=AuditLogPaginated)
def read_audit_logs(
    page: Optional[int] = Query(None, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    action: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("timestamp", regex="^(id|timestamp|action)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user = Depends(require_security)
):
    query = db.query(AuditLog).outerjoin(Booking).outerjoin(User, AuditLog.performed_by_id == User.id)
    
    if action:
        query = query.filter(AuditLog.action == action)
        
    if search:
        search_val = f"%{search}%"
        query = query.filter(
            (AuditLog.details.ilike(search_val)) |
            (AuditLog.action.ilike(search_val)) |
            (User.username.ilike(search_val))
        )
        
    # Stable sorting
    sort_attr = {"id": AuditLog.id, "timestamp": AuditLog.timestamp, "action": AuditLog.action}[sort_by]
    if sort_order == "desc":
        query = query.order_by(sort_attr.desc(), AuditLog.id.desc())
    else:
        query = query.order_by(sort_attr.asc(), AuditLog.id.asc())
        
    total = query.count()
    
    if page is not None:
        query = query.offset((page - 1) * page_size).limit(page_size)
        
    return {"items": query.all(), "total": total}
