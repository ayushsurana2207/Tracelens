from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import LLMTrace
from ..schemas import LLMTraceCreate, LLMTraceOut

router = APIRouter(prefix="/traces", tags=["llm-traces"])

@router.post("", response_model=LLMTraceOut)
def create_trace(payload: LLMTraceCreate, db: Session = Depends(get_db)):
    obj = LLMTrace(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("", response_model=List[LLMTraceOut])
def list_traces(
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
    model: Optional[str] = None,
    provider: Optional[str] = None,
    status: Optional[str] = None,
):
    q = db.query(LLMTrace).order_by(LLMTrace.created_at.desc())
    if model:
        q = q.filter(LLMTrace.model == model)
    if provider:
        q = q.filter(LLMTrace.provider == provider)
    if status:
        q = q.filter(LLMTrace.status == status)
    return q.offset(offset).limit(limit).all()
