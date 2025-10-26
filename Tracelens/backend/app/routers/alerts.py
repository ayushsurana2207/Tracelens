from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta
import json
import asyncio
from ..database import get_db
from ..models import Alert, AlertThreshold, LLMTrace, AgentSession, AgentSpan
from ..schemas import AlertCreate, AlertOut, AlertThresholdCreate, AlertThresholdOut

router = APIRouter(prefix="/alerts", tags=["alerts"])

# WebSocket connection manager for alerts
class AlertConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast_alert(self, alert: Alert):
        message = {
            "type": "new_alert",
            "data": {
                "id": alert.id,
                "severity": alert.severity,
                "title": alert.title,
                "description": alert.description,
                "metric": alert.metric,
                "threshold": alert.threshold,
                "created_at": alert.created_at.isoformat(),
                "alert_type": alert.alert_type
            }
        }
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                self.active_connections.remove(connection)

alert_manager = AlertConnectionManager()

@router.post("", response_model=AlertOut)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    alert = Alert(**payload.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    # Broadcast to WebSocket connections
    asyncio.create_task(alert_manager.broadcast_alert(alert))
    
    return alert

@router.get("", response_model=List[AlertOut])
def list_alerts(
    db: Session = Depends(get_db), 
    limit: int = 50, 
    offset: int = 0,
    severity: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    alert_type: Optional[str] = None
):
    q = db.query(Alert)
    
    if severity:
        q = q.filter(Alert.severity == severity)
    if acknowledged is not None:
        q = q.filter(Alert.acknowledged == acknowledged)
    if alert_type:
        q = q.filter(Alert.alert_type == alert_type)
    
    return q.order_by(Alert.created_at.desc()).offset(offset).limit(limit).all()

@router.post("/{alert_id}/ack", response_model=AlertOut)
def acknowledge_alert(alert_id: int, acknowledged_by: Optional[str] = None, db: Session = Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.acknowledged = True
    alert.acknowledged_at = datetime.utcnow()
    alert.acknowledged_by = acknowledged_by
    db.commit()
    db.refresh(alert)
    return alert

@router.post("/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return alert

@router.get("/summary")
def get_alerts_summary(db: Session = Depends(get_db)):
    """Get summary of alerts by severity"""
    results = db.query(
        Alert.severity,
        func.count(Alert.id).label('count'),
        func.count(Alert.id).filter(Alert.acknowledged == False).label('unacknowledged_count')
    ).group_by(Alert.severity).all()
    
    return {
        "by_severity": [
            {
                "severity": row.severity,
                "total": row.count,
                "unacknowledged": row.unacknowledged_count
            }
            for row in results
        ],
        "total_alerts": sum(row.count for row in results),
        "unacknowledged_alerts": sum(row.unacknowledged_count for row in results)
    }

# Alert Threshold Management
@router.post("/thresholds", response_model=AlertThresholdOut)
def create_threshold(payload: AlertThresholdCreate, db: Session = Depends(get_db)):
    threshold = AlertThreshold(**payload.model_dump())
    db.add(threshold)
    db.commit()
    db.refresh(threshold)
    return threshold

@router.get("/thresholds", response_model=List[AlertThresholdOut])
def list_thresholds(db: Session = Depends(get_db)):
    return db.query(AlertThreshold).order_by(AlertThreshold.metric_name).all()

@router.put("/thresholds/{threshold_id}", response_model=AlertThresholdOut)
def update_threshold(threshold_id: int, payload: AlertThresholdCreate, db: Session = Depends(get_db)):
    threshold = db.get(AlertThreshold, threshold_id)
    if not threshold:
        raise HTTPException(status_code=404, detail="Threshold not found")
    
    for field, value in payload.model_dump().items():
        setattr(threshold, field, value)
    
    threshold.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(threshold)
    return threshold

@router.delete("/thresholds/{threshold_id}")
def delete_threshold(threshold_id: int, db: Session = Depends(get_db)):
    threshold = db.get(AlertThreshold, threshold_id)
    if not threshold:
        raise HTTPException(status_code=404, detail="Threshold not found")
    
    db.delete(threshold)
    db.commit()
    return {"message": "Threshold deleted"}

@router.post("/check-thresholds")
def check_thresholds(db: Session = Depends(get_db)):
    """Check current metrics against thresholds and create alerts if needed"""
    thresholds = db.query(AlertThreshold).filter(AlertThreshold.enabled == True).all()
    new_alerts = []
    
    for threshold in thresholds:
        # Get current metric value based on threshold.metric_name
        if threshold.metric_name == "avg_latency_ms":
            current_value = db.query(func.avg(LLMTrace.latency_ms)).scalar() or 0.0
        elif threshold.metric_name == "error_rate_pct":
            total = db.query(func.count(LLMTrace.id)).scalar() or 0
            errors = db.query(func.count(LLMTrace.id)).filter(LLMTrace.status == "failure").scalar() or 0
            current_value = (errors / total * 100) if total else 0.0
        elif threshold.metric_name == "total_cost_usd":
            current_value = db.query(func.sum(LLMTrace.cost_usd)).scalar() or 0.0
        elif threshold.metric_name == "requests_per_minute":
            one_hour_ago = datetime.utcnow() - timedelta(hours=1)
            recent_requests = db.query(func.count(LLMTrace.id)).filter(LLMTrace.created_at >= one_hour_ago).scalar() or 0
            current_value = recent_requests / 60.0
        else:
            continue
        
        # Check if threshold is exceeded
        if current_value > threshold.threshold_value:
            # Check if alert already exists for this threshold
            existing_alert = db.query(Alert).filter(
                and_(
                    Alert.metric_name == threshold.metric_name,
                    Alert.acknowledged == False,
                    Alert.created_at >= datetime.utcnow() - timedelta(minutes=5)  # Within last 5 minutes
                )
            ).first()
            
            if not existing_alert:
                alert = Alert(
                    severity=threshold.severity,
                    title=f"{threshold.metric_name} threshold exceeded",
                    description=f"Current value: {current_value:.2f}, Threshold: {threshold.threshold_value:.2f}",
                    metric=current_value,
                    threshold=threshold.threshold_value,
                    alert_type="threshold",
                    metric_name=threshold.metric_name
                )
                db.add(alert)
                new_alerts.append(alert)
    
    if new_alerts:
        db.commit()
        for alert in new_alerts:
            db.refresh(alert)
            asyncio.create_task(alert_manager.broadcast_alert(alert))
    
    return {"checked_thresholds": len(thresholds), "new_alerts_created": len(new_alerts)}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await alert_manager.connect(websocket)
    try:
        while True:
            await asyncio.sleep(1)  # Keep connection alive
    except WebSocketDisconnect:
        alert_manager.disconnect(websocket)
