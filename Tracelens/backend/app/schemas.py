from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class LLMTraceCreate(BaseModel):
    model: str
    provider: str
    latency_ms: float
    tokens: int
    cost_usd: float = 0.0
    status: str = "success"
    session_id: Optional[int] = None
    span_id: Optional[int] = None
    
    # Additional fields
    input_tokens: int = 0
    output_tokens: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    error_message: Optional[str] = None
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    endpoint: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class LLMTraceOut(LLMTraceCreate):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class AgentSpanCreate(BaseModel):
    session_id: int
    parent_id: Optional[int] = None
    span_type: str
    name: str
    status: str = "success"
    latency_ms: float = 0.0
    prompt: Optional[str] = None
    output: Optional[str] = None
    error: Optional[str] = None
    
    # Additional fields
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    tokens_used: int = 0
    cost_usd: float = 0.0
    model_used: Optional[str] = None
    provider_used: Optional[str] = None
    tool_calls: Optional[Dict[str, Any]] = None
    reasoning_steps: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    trace_id: Optional[str] = None

class AgentSpanOut(AgentSpanCreate):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class AgentSessionCreate(BaseModel):
    user_id: Optional[str] = None
    title: Optional[str] = None
    status: str = "running"
    metadata: Optional[Dict[str, Any]] = None

class AgentSessionOut(AgentSessionCreate):
    id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    total_latency_ms: float = 0.0
    total_tokens: int = 0
    total_cost_usd: float = 0.0
    error_message: Optional[str] = None
    class Config:
        from_attributes = True

class AlertCreate(BaseModel):
    severity: str
    title: str
    description: Optional[str] = None
    metric: float
    threshold: float
    alert_type: str
    metric_name: Optional[str] = None
    session_id: Optional[int] = None
    span_id: Optional[int] = None
    trace_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class AlertOut(AlertCreate):
    id: int
    acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class AlertThresholdCreate(BaseModel):
    metric_name: str
    threshold_value: float
    severity: str
    enabled: bool = True
    description: Optional[str] = None

class AlertThresholdOut(AlertThresholdCreate):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class MetricsSummary(BaseModel):
    total_requests: int = 0
    avg_latency_ms: float = 0.0
    total_tokens: int = 0
    total_cost_usd: float = 0.0
    success_rate_pct: float = 0.0
    failure_rate_pct: float = 0.0
    
    # Additional metrics
    p95_latency_ms: float = 0.0
    p99_latency_ms: float = 0.0
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    avg_tokens_per_request: float = 0.0
    cost_per_token: float = 0.0
    requests_per_minute: float = 0.0
    error_rate_pct: float = 0.0

class TimeSeriesDataPoint(BaseModel):
    timestamp: datetime
    value: float
    label: Optional[str] = None

class MetricsTimeSeries(BaseModel):
    metric_name: str
    data_points: List[TimeSeriesDataPoint]
    aggregation: str = "avg"  # avg | sum | count | max | min
