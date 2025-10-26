from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from ..database import get_db
from ..models import AgentSession, AgentSpan, LLMTrace
from ..schemas import AgentSessionCreate, AgentSessionOut, AgentSpanCreate, AgentSpanOut

router = APIRouter(prefix="/agents", tags=["agent-workflow"])

@router.post("/sessions", response_model=AgentSessionOut)
def create_session(payload: AgentSessionCreate, db: Session = Depends(get_db)):
    session = AgentSession(**payload.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions", response_model=List[AgentSessionOut])
def list_sessions(
    db: Session = Depends(get_db), 
    limit: int = 50, 
    offset: int = 0,
    status: Optional[str] = None,
    user_id: Optional[str] = None
):
    q = db.query(AgentSession)
    
    if status:
        q = q.filter(AgentSession.status == status)
    if user_id:
        q = q.filter(AgentSession.user_id == user_id)
    
    return q.order_by(AgentSession.started_at.desc()).offset(offset).limit(limit).all()

@router.get("/sessions/{session_id}", response_model=AgentSessionOut)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.get(AgentSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.put("/sessions/{session_id}", response_model=AgentSessionOut)
def update_session(session_id: int, payload: AgentSessionCreate, db: Session = Depends(get_db)):
    session = db.get(AgentSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    for field, value in payload.model_dump().items():
        setattr(session, field, value)
    
    db.commit()
    db.refresh(session)
    return session

@router.post("/spans", response_model=AgentSpanOut)
def create_span(payload: AgentSpanCreate, db: Session = Depends(get_db)):
    span = AgentSpan(**payload.model_dump())
    db.add(span)
    db.commit()
    db.refresh(span)
    return span

@router.get("/sessions/{session_id}/spans", response_model=List[AgentSpanOut])
def get_session_spans(session_id: int, db: Session = Depends(get_db)):
    return db.query(AgentSpan).filter(AgentSpan.session_id==session_id).order_by(AgentSpan.created_at.asc()).all()

@router.get("/sessions/{session_id}/spans/tree")
def get_session_spans_tree(session_id: int, db: Session = Depends(get_db)):
    """Get spans organized as a hierarchical tree"""
    spans = db.query(AgentSpan).filter(AgentSpan.session_id==session_id).order_by(AgentSpan.created_at.asc()).all()
    
    # Build tree structure
    span_map = {span.id: span for span in spans}
    root_spans = []
    
    for span in spans:
        if span.parent_id and span.parent_id in span_map:
            parent = span_map[span.parent_id]
            if not hasattr(parent, 'children'):
                parent.children = []
            parent.children.append(span)
        else:
            root_spans.append(span)
    
    def serialize_span(span):
        result = {
            "id": span.id,
            "span_type": span.span_type,
            "name": span.name,
            "status": span.status,
            "latency_ms": span.latency_ms,
            "prompt": span.prompt,
            "output": span.output,
            "error": span.error,
            "created_at": span.created_at.isoformat(),
            "started_at": span.started_at.isoformat() if span.started_at else None,
            "ended_at": span.ended_at.isoformat() if span.ended_at else None,
            "tokens_used": span.tokens_used,
            "cost_usd": span.cost_usd,
            "model_used": span.model_used,
            "provider_used": span.provider_used,
            "tool_calls": span.tool_calls,
            "reasoning_steps": span.reasoning_steps,
            "metadata": span.metadata,
            "trace_id": span.trace_id,
            "children": []
        }
        
        if hasattr(span, 'children'):
            result["children"] = [serialize_span(child) for child in span.children]
        
        return result
    
    return [serialize_span(span) for span in root_spans]

@router.get("/sessions/{session_id}/analysis")
def get_session_analysis(session_id: int, db: Session = Depends(get_db)):
    """Get comprehensive analysis of a session including root cause analysis"""
    session = db.get(AgentSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    spans = db.query(AgentSpan).filter(AgentSpan.session_id==session_id).all()
    llm_traces = db.query(LLMTrace).filter(LLMTrace.session_id==session_id).all()
    
    # Calculate session metrics
    total_spans = len(spans)
    failed_spans = [s for s in spans if s.status == "failure"]
    success_spans = [s for s in spans if s.status == "success"]
    
    total_latency = sum(s.latency_ms for s in spans)
    total_tokens = sum(s.tokens_used for s in spans)
    total_cost = sum(s.cost_usd for s in spans) + sum(t.cost_usd for t in llm_traces)
    
    # Root cause analysis
    root_causes = []
    if failed_spans:
        for span in failed_spans:
            root_causes.append({
                "span_id": span.id,
                "span_name": span.name,
                "span_type": span.span_type,
                "error": span.error,
                "latency_ms": span.latency_ms,
                "created_at": span.created_at.isoformat()
            })
    
    # Performance bottlenecks
    bottlenecks = []
    if spans:
        avg_latency = total_latency / len(spans)
        for span in spans:
            if span.latency_ms > avg_latency * 2:  # 2x average latency
                bottlenecks.append({
                    "span_id": span.id,
                    "span_name": span.name,
                    "span_type": span.span_type,
                    "latency_ms": span.latency_ms,
                    "avg_latency_ms": avg_latency,
                    "latency_ratio": span.latency_ms / avg_latency
                })
    
    # Token usage analysis
    token_analysis = {
        "total_tokens": total_tokens,
        "total_cost": total_cost,
        "cost_per_token": total_cost / total_tokens if total_tokens > 0 else 0,
        "llm_calls": len(llm_traces),
        "avg_tokens_per_call": total_tokens / len(llm_traces) if llm_traces else 0
    }
    
    return {
        "session": {
            "id": session.id,
            "title": session.title,
            "status": session.status,
            "started_at": session.started_at.isoformat(),
            "ended_at": session.ended_at.isoformat() if session.ended_at else None,
            "total_latency_ms": total_latency,
            "total_tokens": total_tokens,
            "total_cost_usd": total_cost
        },
        "metrics": {
            "total_spans": total_spans,
            "successful_spans": len(success_spans),
            "failed_spans": len(failed_spans),
            "success_rate": len(success_spans) / total_spans * 100 if total_spans > 0 else 0,
            "avg_latency_ms": total_latency / total_spans if total_spans > 0 else 0
        },
        "root_causes": root_causes,
        "bottlenecks": bottlenecks,
        "token_analysis": token_analysis,
        "llm_traces": [
            {
                "id": trace.id,
                "model": trace.model,
                "provider": trace.provider,
                "latency_ms": trace.latency_ms,
                "tokens": trace.tokens,
                "cost_usd": trace.cost_usd,
                "status": trace.status,
                "created_at": trace.created_at.isoformat()
            }
            for trace in llm_traces
        ]
    }

@router.get("/sessions/{session_id}/trace")
def get_session_trace(session_id: int, db: Session = Depends(get_db)):
    """Get detailed trace information for a session"""
    session = db.get(AgentSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    spans = db.query(AgentSpan).filter(AgentSpan.session_id==session_id).order_by(AgentSpan.created_at.asc()).all()
    
    # Create timeline
    timeline = []
    for span in spans:
        timeline.append({
            "timestamp": span.created_at.isoformat(),
            "type": "span",
            "span_id": span.id,
            "span_name": span.name,
            "span_type": span.span_type,
            "status": span.status,
            "latency_ms": span.latency_ms,
            "parent_id": span.parent_id
        })
    
    # Sort by timestamp
    timeline.sort(key=lambda x: x["timestamp"])
    
    return {
        "session_id": session_id,
        "timeline": timeline,
        "total_spans": len(spans),
        "duration_ms": (session.ended_at - session.started_at).total_seconds() * 1000 if session.ended_at else None
    }

@router.get("/sessions/summary")
def get_sessions_summary(
    db: Session = Depends(get_db),
    hours: int = Query(24, description="Hours of data to include")
):
    """Get summary of all sessions"""
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    sessions = db.query(AgentSession).filter(AgentSession.started_at >= start_time).all()
    
    total_sessions = len(sessions)
    completed_sessions = len([s for s in sessions if s.status == "completed"])
    failed_sessions = len([s for s in sessions if s.status == "failed"])
    running_sessions = len([s for s in sessions if s.status == "running"])
    
    avg_latency = sum(s.total_latency_ms for s in sessions) / total_sessions if total_sessions > 0 else 0
    total_cost = sum(s.total_cost_usd for s in sessions)
    total_tokens = sum(s.total_tokens for s in sessions)
    
    return {
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "failed_sessions": failed_sessions,
        "running_sessions": running_sessions,
        "success_rate": completed_sessions / total_sessions * 100 if total_sessions > 0 else 0,
        "avg_latency_ms": avg_latency,
        "total_cost_usd": total_cost,
        "total_tokens": total_tokens,
        "time_range_hours": hours
    }
