""" Enhanced seed script for comprehensive demo data. """
import random
import json
from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models import LLMTrace, AgentSession, AgentSpan, Alert, AlertThreshold

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Enhanced models and providers
models = [
    ("gpt-4", "openai"), ("gpt-4-turbo", "openai"), ("gpt-3.5-turbo", "openai"),
    ("claude-3-sonnet", "anthropic"), ("claude-3-haiku", "anthropic"), ("claude-3-opus", "anthropic"),
    ("gemini-pro", "google"), ("gemini-pro-vision", "google"), ("palm-2", "google"),
    ("llama-2-70b", "meta"), ("llama-2-13b", "meta"), ("codellama-34b", "meta")
]

statuses = ["success", "success", "success", "success", "failure"]
span_types = ["agent", "tool", "reasoning", "llm_call"]

print("Creating LLM traces...")
# Enhanced LLM traces with more realistic data
for i in range(200):
    model, provider = random.choice(models)
    latency = random.randint(200, 15000)
    tokens = random.randint(50, 4000)
    input_tokens = random.randint(10, tokens // 2)
    output_tokens = tokens - input_tokens
    cost = round(tokens / 100000 * (0.1 + random.random() * 0.5), 6)
    status = random.choice(statuses)
    
    # Create realistic timestamps over the last 7 days
    created_at = datetime.utcnow() - timedelta(
        days=random.randint(0, 7),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59)
    )
    
    trace = LLMTrace(
        model=model,
        provider=provider,
        latency_ms=latency,
        tokens=tokens,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        prompt_tokens=input_tokens,
        completion_tokens=output_tokens,
        cost_usd=cost,
        status=status,
        error_message=f"API rate limit exceeded" if status == "failure" else None,
        request_id=f"req_{random.randint(100000, 999999)}",
        user_id=f"user_{random.randint(1, 50)}",
        endpoint=f"/v1/chat/completions",
        temperature=random.uniform(0.1, 1.0),
        max_tokens=random.randint(100, 2000),
        metadata={
            "conversation_id": f"conv_{random.randint(1000, 9999)}",
            "session_id": f"session_{random.randint(100, 999)}",
            "model_version": f"{model}-v{random.randint(1, 3)}"
        },
        created_at=created_at
    )
    db.add(trace)

db.commit()
print("✓ Created 200 LLM traces")

print("Creating agent sessions and spans...")
# Enhanced agent sessions with realistic workflows
session_titles = [
    "Customer Support Bot Session",
    "Code Review Assistant",
    "Document Analysis Pipeline", 
    "Multi-Agent Research Task",
    "Content Generation Workflow",
    "Data Processing Agent",
    "Translation Service",
    "Question Answering System",
    "Creative Writing Assistant",
    "Technical Support Agent"
]

for sidx in range(15):
    # Create session
    title = random.choice(session_titles)
    started_at = datetime.utcnow() - timedelta(
        days=random.randint(0, 7),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59)
    )
    
    session = AgentSession(
        title=title,
        user_id=f"user_{random.randint(1, 50)}",
        status=random.choice(["completed", "running", "failed"]),
        started_at=started_at,
        ended_at=started_at + timedelta(minutes=random.randint(1, 30)) if random.random() > 0.2 else None,
        metadata={
            "environment": random.choice(["production", "staging", "development"]),
            "version": f"v{random.randint(1, 5)}.{random.randint(0, 9)}",
            "region": random.choice(["us-east", "us-west", "eu-west", "asia-pacific"])
        }
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Create hierarchical spans
    main_agent = AgentSpan(
        session_id=session.id,
        span_type="agent",
        name="MainAgent",
        status="success" if random.random() > 0.1 else "failure",
        latency_ms=random.randint(2000, 8000),
        prompt="You are a helpful AI assistant. Please help the user with their request.",
        output="I'll help you with that request. Let me process this step by step.",
        started_at=started_at,
        ended_at=started_at + timedelta(seconds=random.randint(2, 8)),
        tokens_used=random.randint(100, 500),
        cost_usd=random.uniform(0.001, 0.01),
        model_used=random.choice(models)[0],
        provider_used=random.choice(models)[1],
        trace_id=f"trace_{random.randint(10000, 99999)}"
    )
    db.add(main_agent)
    db.commit()
    db.refresh(main_agent)

    # Create child spans
    child_spans = []
    num_children = random.randint(2, 5)
    
    for j in range(num_children):
        span_type = random.choice(span_types)
        name = f"{span_type.title()}_{j+1}"
        
        child_span = AgentSpan(
            session_id=session.id,
            parent_id=main_agent.id,
            span_type=span_type,
            name=name,
            status="success" if random.random() > 0.15 else "failure",
            latency_ms=random.randint(100, 3000),
            prompt=f"Processing {span_type} task" if span_type in ["agent", "reasoning"] else None,
            output=f"Completed {span_type} operation" if random.random() > 0.1 else None,
            error=f"Failed to execute {span_type}" if random.random() < 0.15 else None,
            started_at=started_at + timedelta(seconds=random.randint(1, 5)),
            ended_at=started_at + timedelta(seconds=random.randint(6, 15)),
            tokens_used=random.randint(20, 200),
            cost_usd=random.uniform(0.0001, 0.005),
            model_used=random.choice(models)[0] if span_type == "llm_call" else None,
            provider_used=random.choice(models)[1] if span_type == "llm_call" else None,
            tool_calls={
                "tool_name": f"tool_{j+1}",
                "parameters": {"param1": f"value_{j+1}"},
                "result": f"Tool {j+1} executed successfully"
            } if span_type == "tool" else None,
            reasoning_steps=[
                f"Step {k+1}: Analyzing {span_type} requirements",
                f"Step {k+2}: Executing {span_type} logic",
                f"Step {k+3}: Validating {span_type} results"
            ] if span_type == "reasoning" else None,
            metadata={
                "iteration": j+1,
                "priority": random.choice(["high", "medium", "low"]),
                "retry_count": random.randint(0, 3)
            }
        )
        child_spans.append(child_span)
        db.add(child_span)

    db.commit()
    print(f"✓ Created session {sidx+1} with {num_children+1} spans")

print("Creating alert thresholds...")
# Create realistic alert thresholds
thresholds = [
    ("avg_latency_ms", 5000, "HIGH", "Average response time threshold"),
    ("error_rate_pct", 5.0, "MEDIUM", "Error rate percentage threshold"),
    ("total_cost_usd", 100.0, "LOW", "Daily cost threshold"),
    ("requests_per_minute", 100, "MEDIUM", "Request rate threshold"),
    ("p95_latency_ms", 10000, "CRITICAL", "95th percentile latency threshold"),
    ("p99_latency_ms", 15000, "HIGH", "99th percentile latency threshold")
]

for metric_name, threshold_value, severity, description in thresholds:
    threshold = AlertThreshold(
        metric_name=metric_name,
        threshold_value=threshold_value,
        severity=severity,
        enabled=True,
        description=description
    )
    db.add(threshold)

db.commit()
print("✓ Created alert thresholds")

print("Creating alerts...")
# Create realistic alerts
alert_templates = [
    ("High latency detected", "latency", "Average latency has exceeded threshold"),
    ("Error rate spike", "error_rate", "Error rate has increased significantly"),
    ("Cost threshold exceeded", "cost", "Daily cost limit has been reached"),
    ("Request rate anomaly", "token_usage", "Unusual request pattern detected"),
    ("Model performance degradation", "latency", "Model response times are degrading"),
    ("Token usage spike", "token_usage", "Token consumption has increased unexpectedly")
]

for i in range(8):
    title, alert_type, description = random.choice(alert_templates)
    severity = random.choice(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    metric = random.uniform(1000, 20000)
    threshold = random.uniform(500, 15000)
    
    created_at = datetime.utcnow() - timedelta(
        hours=random.randint(0, 48),
        minutes=random.randint(0, 59)
    )
    
    alert = Alert(
        severity=severity,
        title=title,
        description=description,
        metric=metric,
        threshold=threshold,
        alert_type=alert_type,
        metric_name=random.choice(["avg_latency_ms", "error_rate_pct", "total_cost_usd"]),
        acknowledged=random.random() > 0.3,
        acknowledged_at=created_at + timedelta(minutes=random.randint(5, 60)) if random.random() > 0.3 else None,
        acknowledged_by=f"user_{random.randint(1, 10)}" if random.random() > 0.3 else None,
        created_at=created_at,
        resolved_at=created_at + timedelta(hours=random.randint(1, 24)) if random.random() > 0.5 else None,
        metadata={
            "source": random.choice(["monitoring", "user_report", "automated_check"]),
            "environment": random.choice(["production", "staging"]),
            "region": random.choice(["us-east", "eu-west"])
        }
    )
    db.add(alert)

db.commit()
print("✓ Created 8 alerts")

print("\n🎉 Demo data seeding completed!")
print("📊 Summary:")
print(f"   • {db.query(LLMTrace).count()} LLM traces")
print(f"   • {db.query(AgentSession).count()} agent sessions")
print(f"   • {db.query(AgentSpan).count()} agent spans")
print(f"   • {db.query(Alert).count()} alerts")
print(f"   • {db.query(AlertThreshold).count()} alert thresholds")

db.close()
