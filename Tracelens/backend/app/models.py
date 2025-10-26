from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class LLMTrace(Base):
    __tablename__ = "llm_traces"
    id = Column(Integer, primary_key=True, index=True)
    model = Column(String, index=True)           # e.g. gpt-5
    provider = Column(String, index=True)        # e.g. openai, anthropic, google
    latency_ms = Column(Float)
    tokens = Column(Integer)
    cost_usd = Column(Float, default=0.0)
    status = Column(String, default="success")   # success | failure
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    session_id = Column(Integer, ForeignKey("agent_sessions.id"), nullable=True)
    span_id = Column(Integer, ForeignKey("agent_spans.id"), nullable=True)
    
    # Additional fields for comprehensive tracking
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    request_id = Column(String, nullable=True, index=True)
    user_id = Column(String, nullable=True, index=True)
    endpoint = Column(String, nullable=True)
    temperature = Column(Float, nullable=True)
    max_tokens = Column(Integer, nullable=True)
    metadata = Column(JSON, nullable=True)  # Store additional context

class AgentSession(Base):
    __tablename__ = "agent_sessions"
    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, index=True)
    ended_at = Column(DateTime, nullable=True)
    user_id = Column(String, nullable=True)
    title = Column(String, nullable=True)   # optional session label
    status = Column(String, default="running")  # running | completed | failed
    total_latency_ms = Column(Float, default=0.0)
    total_tokens = Column(Integer, default=0)
    total_cost_usd = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)

    spans = relationship("AgentSpan", back_populates="session", cascade="all, delete-orphan")

class AgentSpan(Base):
    __tablename__ = "agent_spans"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("agent_sessions.id"), index=True)
    parent_id = Column(Integer, ForeignKey("agent_spans.id"), nullable=True)
    span_type = Column(String, index=True)   # agent | tool | reasoning | llm_call
    name = Column(String, index=True)        # e.g. "MainAgent", "SearchTool"
    status = Column(String, default="success")
    latency_ms = Column(Float, default=0.0)
    prompt = Column(Text, nullable=True)     # system/user prompt or reasoning text
    output = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Additional fields for comprehensive tracking
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    tokens_used = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)
    model_used = Column(String, nullable=True)
    provider_used = Column(String, nullable=True)
    tool_calls = Column(JSON, nullable=True)  # Store tool call details
    reasoning_steps = Column(JSON, nullable=True)  # Store chain-of-thought steps
    metadata = Column(JSON, nullable=True)
    trace_id = Column(String, nullable=True, index=True)  # For distributed tracing

    session = relationship("AgentSession", back_populates="spans")
    parent = relationship("AgentSpan", remote_side=[id])

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    severity = Column(String, index=True)  # LOW | MEDIUM | HIGH | CRITICAL
    title = Column(String)
    description = Column(Text, nullable=True)
    metric = Column(Float, default=0.0)
    threshold = Column(Float, default=0.0)
    acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Additional fields for comprehensive alerting
    alert_type = Column(String, index=True)  # latency | error_rate | cost | token_usage
    metric_name = Column(String, nullable=True)  # e.g. "avg_latency_ms", "error_rate_pct"
    session_id = Column(Integer, ForeignKey("agent_sessions.id"), nullable=True)
    span_id = Column(Integer, ForeignKey("agent_spans.id"), nullable=True)
    trace_id = Column(Integer, ForeignKey("llm_traces.id"), nullable=True)
    metadata = Column(JSON, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

class AlertThreshold(Base):
    __tablename__ = "alert_thresholds"
    id = Column(Integer, primary_key=True, index=True)
    metric_name = Column(String, index=True)  # e.g. "avg_latency_ms", "error_rate_pct"
    threshold_value = Column(Float)
    severity = Column(String)  # LOW | MEDIUM | HIGH | CRITICAL
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    description = Column(Text, nullable=True)
