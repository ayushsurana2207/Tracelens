from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import metrics, traces, agents, alerts

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Observability API", 
    version="0.1.0",
    description="Comprehensive AI observability platform for LLM tracking and agent workflow monitoring"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router)
app.include_router(traces.router)
app.include_router(agents.router)
app.include_router(alerts.router)

@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}

@app.get("/")
def root():
    return {
        "message": "AI Observability API",
        "version": "0.1.0",
        "docs": "/docs",
        "features": [
            "LLM Tracking - Latency, throughput, token usage, cost tracking",
            "Agent Workflow Tracking - End-to-end execution traces",
            "Hierarchical View - Multi-agent system visualization", 
            "Reasoning Chain Logging - Tool usage and decision paths",
            "Root Cause Analysis - Failure investigation tools",
            "Real-time Alerts - WebSocket-based notifications",
            "Threshold Management - Configurable alerting rules"
        ]
    }
