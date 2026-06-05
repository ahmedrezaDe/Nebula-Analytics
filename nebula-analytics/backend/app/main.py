from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, UTC
from typing import List

from app.config import settings
from app.database import init_db, get_db
from app.models import MetricEntry, AnomalyEvent, AIInsight  # <--- Clean imports verified
from app.ml_engine import detect_and_log_anomalies

init_db()

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# 🚨 CORS MUST BE INSTANTIATED BEFORE THE ENDPOINTS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open up completely for local testing to clear out 'Failed to fetch'
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MetricPayload(BaseModel):
    entity: str
    metric_name: str
    value: float

class IngestResponse(BaseModel):
    status: str
    records_inserted: int

@app.get("/")
async def root_health_check():
    return {"status": "online", "engine": settings.PROJECT_NAME}

@app.post("/api/v1/ingest", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_telemetry_stream(payloads: List[MetricPayload], db: Session = Depends(get_db)):
    current_time = datetime.now(UTC).replace(tzinfo=None)
    for payload in payloads:
        entry = MetricEntry(
            entity=payload.entity,
            metric_name=payload.metric_name,
            value=payload.value,
            timestamp=current_time
        )
        db.add(entry)
    db.commit()

    if payloads:
        detect_and_log_anomalies(db, entity=payloads[0].entity)

    return {"status": "success", "records_inserted": len(payloads)}

@app.get("/api/v1/anomalies")
async def get_flagged_anomalies(db: Session = Depends(get_db)):
    anomalies = db.query(AnomalyEvent).order_by(AnomalyEvent.timestamp.desc()).limit(50).all()
    return [
        {
            "id": a.id,
            "score": a.score,
            "description": a.description,
            "timestamp": a.timestamp
        } for a in anomalies
    ]

@app.get("/api/v1/insights")
async def get_ai_insights_feed(db: Session = Depends(get_db)):
    results = db.query(AnomalyEvent).join(AIInsight).order_by(AnomalyEvent.timestamp.desc()).limit(10).all()
    return [
        {
            "anomaly_id": anomaly.id,
            "score": anomaly.score,
            "technical_specs": anomaly.description,
            "timestamp": anomaly.timestamp,
            "ai_executive_summary": anomaly.insight.content if anomaly.insight else "Awaiting processing."
        }
        for anomaly in results
    ]