from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
from datetime import datetime, timedelta
import json
import asyncio
from ..database import get_db
from ..models import LLMTrace, AgentSession, AgentSpan, Alert
from ..schemas import MetricsSummary, MetricsTimeSeries, TimeSeriesDataPoint

router = APIRouter(prefix="/metrics", tags=["metrics"])

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                # Remove disconnected connections
                self.active_connections.remove(connection)

manager = ConnectionManager()

@router.get("/summary", response_model=MetricsSummary)
def get_summary(db: Session = Depends(get_db)):
    # Basic metrics
    total = db.query(func.count(LLMTrace.id)).scalar() or 0
    avg_latency = db.query(func.avg(LLMTrace.latency_ms)).scalar() or 0.0
    total_tokens = db.query(func.sum(LLMTrace.tokens)).scalar() or 0
    total_cost = db.query(func.sum(LLMTrace.cost_usd)).scalar() or 0.0
    success = db.query(func.count(LLMTrace.id)).filter(LLMTrace.status=="success").scalar() or 0
    failure = db.query(func.count(LLMTrace.id)).filter(LLMTrace.status=="failure").scalar() or 0
    success_rate = (success / total * 100.0) if total else 0.0
    failure_rate = (failure / total * 100.0) if total else 0.0
    
    # Additional metrics
    p95_latency = db.query(func.percentile_cont(0.95).within_group(LLMTrace.latency_ms)).scalar() or 0.0
    p99_latency = db.query(func.percentile_cont(0.99).within_group(LLMTrace.latency_ms)).scalar() or 0.0
    total_input_tokens = db.query(func.sum(LLMTrace.input_tokens)).scalar() or 0
    total_output_tokens = db.query(func.sum(LLMTrace.output_tokens)).scalar() or 0
    avg_tokens_per_request = (total_tokens / total) if total else 0.0
    cost_per_token = (total_cost / total_tokens) if total_tokens else 0.0
    
    # Calculate requests per minute (last hour)
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    recent_requests = db.query(func.count(LLMTrace.id)).filter(LLMTrace.created_at >= one_hour_ago).scalar() or 0
    requests_per_minute = recent_requests / 60.0
    
    return MetricsSummary(
        total_requests=total,
        avg_latency_ms=avg_latency,
        total_tokens=total_tokens,
        total_cost_usd=total_cost,
        success_rate_pct=success_rate,
        failure_rate_pct=failure_rate,
        p95_latency_ms=p95_latency,
        p99_latency_ms=p99_latency,
        total_input_tokens=total_input_tokens,
        total_output_tokens=total_output_tokens,
        avg_tokens_per_request=avg_tokens_per_request,
        cost_per_token=cost_per_token,
        requests_per_minute=requests_per_minute,
        error_rate_pct=failure_rate,
    )

@router.get("/timeseries", response_model=MetricsTimeSeries)
def get_timeseries(
    metric_name: str = Query(..., description="Metric name: latency_ms, tokens, cost_usd, requests"),
    hours: int = Query(24, description="Hours of data to return"),
    aggregation: str = Query("avg", description="Aggregation: avg, sum, count, max, min"),
    db: Session = Depends(get_db)
):
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=hours)
    
    # Build query based on metric and aggregation
    if metric_name == "latency_ms":
        if aggregation == "avg":
            query = db.query(
                func.date_trunc('minute', LLMTrace.created_at).label('timestamp'),
                func.avg(LLMTrace.latency_ms).label('value')
            )
        elif aggregation == "p95":
            query = db.query(
                func.date_trunc('minute', LLMTrace.created_at).label('timestamp'),
                func.percentile_cont(0.95).within_group(LLMTrace.latency_ms).label('value')
            )
        else:
            query = db.query(
                func.date_trunc('minute', LLMTrace.created_at).label('timestamp'),
                func.avg(LLMTrace.latency_ms).label('value')
            )
    elif metric_name == "tokens":
        query = db.query(
            func.date_trunc('minute', LLMTrace.created_at).label('timestamp'),
            func.sum(LLMTrace.tokens).label('value')
        )
    elif metric_name == "cost_usd":
        query = db.query(
            func.date_trunc('minute', LLMTrace.created_at).label('timestamp'),
            func.sum(LLMTrace.cost_usd).label('value')
        )
    elif metric_name == "requests":
        query = db.query(
            func.date_trunc('minute', LLMTrace.created_at).label('timestamp'),
            func.count(LLMTrace.id).label('value')
        )
    else:
        raise ValueError(f"Unknown metric: {metric_name}")
    
    results = query.filter(
        LLMTrace.created_at >= start_time,
        LLMTrace.created_at <= end_time
    ).group_by('timestamp').order_by('timestamp').all()
    
    data_points = [
        TimeSeriesDataPoint(timestamp=row.timestamp, value=float(row.value or 0))
        for row in results
    ]
    
    return MetricsTimeSeries(
        metric_name=metric_name,
        data_points=data_points,
        aggregation=aggregation
    )

@router.get("/models/summary")
def get_models_summary(db: Session = Depends(get_db)):
    """Get summary metrics grouped by model"""
    results = db.query(
        LLMTrace.model,
        LLMTrace.provider,
        func.count(LLMTrace.id).label('total_requests'),
        func.avg(LLMTrace.latency_ms).label('avg_latency'),
        func.sum(LLMTrace.tokens).label('total_tokens'),
        func.sum(LLMTrace.cost_usd).label('total_cost'),
        func.count(LLMTrace.id).filter(LLMTrace.status == 'success').label('success_count'),
        func.count(LLMTrace.id).filter(LLMTrace.status == 'failure').label('failure_count')
    ).group_by(LLMTrace.model, LLMTrace.provider).all()
    
    return [
        {
            "model": row.model,
            "provider": row.provider,
            "total_requests": row.total_requests,
            "avg_latency_ms": float(row.avg_latency or 0),
            "total_tokens": row.total_tokens or 0,
            "total_cost_usd": float(row.total_cost or 0),
            "success_count": row.success_count or 0,
            "failure_count": row.failure_count or 0,
            "success_rate_pct": (row.success_count / row.total_requests * 100) if row.total_requests else 0
        }
        for row in results
    ]

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Send periodic updates
            await asyncio.sleep(5)  # Update every 5 seconds
            summary = get_summary(db=next(get_db()))
            await websocket.send_text(json.dumps({
                "type": "metrics_update",
                "data": summary.dict()
            }))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
