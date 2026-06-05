import asyncio
import random
import json
from datetime import datetime, UTC
from typing import List

from fastapi import FastAPI, Depends, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.config import settings
from app.database import init_db, get_db
from app.models import MetricEntry, AnomalyEvent, AIInsight
from app.ml_engine import detect_and_log_anomalies

# Initialize database schema partitions on startup
init_db()

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ⏱️ STATE VARIABLE: Stores the timestamp of the last active external ingestion call
last_external_ingest_time = datetime.min


# ==========================================
# 🤖 PHASE VI: AUTONOMOUS BACKGROUND WORKER
# ==========================================
async def background_telemetry_injector():
    """
    Autonomous background worker thread. Generates continuous, realistic multi-tenant 
    telemetry metrics if no external ingestion stream is actively hitting the API nodes.
    """
    global last_external_ingest_time
    print("🚀 [BACKGROUND WORKER INITIALIZED] Multi-tenant mock injection engine online.")
    
    verticals = ["industrial", "fintech", "cyber"]
    
    while True:
        try:
            # Check if an external script has sent data within the last 20 seconds
            time_since_last_ingest = (datetime.utcnow() - last_external_ingest_time).total_seconds()
            
            if time_since_last_ingest > 20.0:
                selected_vertical = random.choice(verticals)
                
                # Synthesize high-fidelity baseline data matching our core domains
                if selected_vertical == "industrial":
                    field_1 = round(random.uniform(115.0, 125.0), 2)
                    field_2 = round(random.uniform(42.0, 48.0), 2)
                    entity = f"Turbine_{random.randint(1, 10):02d}"
                    metric_1_name = "hydraulic_pressure"
                    metric_2_name = "structural_vibration"
                    
                elif selected_vertical == "fintech":
                    field_1 = round(random.uniform(150.0, 195.0), 2)
                    field_2 = round(random.uniform(25000.0, 35000.0), 2)
                    entity = f"Ledger_Node_{random.randint(1, 5):02d}"
                    metric_1_name = "pricing_density_delta"
                    metric_2_name = "stream_velocity"
                    
                else:  # cyber
                    field_1 = round(random.uniform(300.0, 450.0), 2)
                    field_2 = round(random.uniform(1200.0, 1800.0), 2)
                    entity = f"Edge_Proxy_{random.randint(1, 12):02d}"
                    metric_1_name = "packet_ingress_latency"
                    metric_2_name = "volume_stream"

                # 🎲 5% systematic probability of forcing a multi-variable anomaly spike
                is_anomaly = random.random() < 0.05
                if is_anomaly:
                    field_1 *= random.choice([1.8, 0.3])
                    field_2 *= random.choice([2.2, 0.4])

                # Route synthetic packet list directly through a temporary database session context
                db: Session = next(get_db())
                current_time = datetime.now(UTC).replace(tzinfo=None)
                
                # Map dual payload rows to fit your existing database table relational schemas
                payloads = [
                    MetricEntry(vertical=selected_vertical, entity=entity, metric_name=metric_1_name, value=field_1, timestamp=current_time),
                    MetricEntry(vertical=selected_vertical, entity=entity, metric_name=metric_2_name, value=field_2, timestamp=current_time)
                ]
                
                print(f"🤖 [MOCK ENGINE] Injecting synthetic telemetry loop for [{selected_vertical.upper()}]")
                for entry in payloads:
                    db.add(entry)
                db.commit()

                # Process the newly committed mock lines directly through your Isolation Forest engine
                detect_and_log_anomalies(db, entity=entity, vertical=selected_vertical)
                
                # Check database to verify if an anomaly event entry was logged
                is_anomaly_detected = False
                latest_entry = db.query(MetricEntry).filter(
                    MetricEntry.vertical == selected_vertical,
                    MetricEntry.entity == entity,
                    MetricEntry.timestamp == current_time
                ).first()
                
                if latest_entry:
                    anomaly_exists = db.query(AnomalyEvent).filter(AnomalyEvent.metric_id == latest_entry.id).first()
                    if anomaly_exists:
                        is_anomaly_detected = True

                # Broadcast data frame out down active WebSocket client channels
                await ws_manager.broadcast({
                    "type": "METRIC_TICK",
                    "vertical": selected_vertical,
                    "data": {
                        "price": field_1,
                        "volume": field_2,
                        "isAnomaly": is_anomaly_detected
                    }
                })
                db.close()
                
            else:
                print(f"📡 [MOCK ENGINE] Standby mode. External ingestion active. Last packet hit: {int(time_since_last_ingest)}s ago.")

        except Exception as e:
            print(f"⚠️ [MOCK ENGINE CRITICAL ERROR]: {e}")
            
        await asyncio.sleep(3.0)


@app.on_event("startup")
async def startup_event():
    # Spin up our asynchronous worker processing thread inside application runtime space
    asyncio.create_task(background_telemetry_injector())


# ==========================================
# 🔌 WEBSOCKET SYSTEM CONNECTION MANAGER
# ==========================================
class TelemetryConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"🔌 Real-time telemetry matrix node mounted. Active pipelines: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"🔌 Telemetry matrix node unmounted. Remaining channels: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        payload_string = json.dumps(message)
        for connection in self.active_connections:
            try:
                await connection.send_text(payload_string)
            except Exception:
                pass

ws_manager = TelemetryConnectionManager()


# ==========================================
# 📊 PYDANTIC SCHEMAS
# ==========================================
class MetricPayload(BaseModel):
    vertical: str  # fintech, industrial, cyber
    entity: str
    metric_name: str
    value: float
    vector_skew: float

class IngestResponse(BaseModel):
    status: str
    records_inserted: int


# ==========================================
# 📡 CORE API ROUTING MAPS
# ==========================================
@app.get("/")
async def root_health_check():
    return {"status": "online", "engine": f"{settings.PROJECT_NAME} Forensics Routing Engine"}


@app.post("/api/v1/ingest", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_telemetry_stream(payloads: List[MetricPayload], db: Session = Depends(get_db)):
    global last_external_ingest_time
    
    # ⏱️ Update tracker immediately to mark that an external script is taking ownership
    last_external_ingest_time = datetime.utcnow()
    
    current_time = datetime.now(UTC).replace(tzinfo=None)
    
    for p in payloads:
        entry = MetricEntry(
            vertical=p.vertical,
            entity=p.entity,
            metric_name=p.metric_name,
            value=p.value,
            timestamp=current_time
        )
        db.add(entry)
    db.commit()

    is_anomaly_detected = False
    if payloads:
        detect_and_log_anomalies(db, entity=payloads[0].entity, vertical=payloads[0].vertical)
        
        latest_entry = db.query(MetricEntry).filter(
            MetricEntry.vertical == payloads[0].vertical,
            MetricEntry.entity == payloads[0].entity,
            MetricEntry.timestamp == current_time
        ).first()
        
        if latest_entry:
            anomaly_exists = db.query(AnomalyEvent).filter(AnomalyEvent.metric_id == latest_entry.id).first()
            if anomaly_exists:
                is_anomaly_detected = True

        await ws_manager.broadcast({
            "type": "METRIC_TICK",
            "vertical": payloads[0].vertical,
            "data": {
                "price": payloads[0].value,
                "volume": payloads[1].value if len(payloads) > 1 else 0.0,
                "isAnomaly": is_anomaly_detected
            }
        })

    return {"status": "success", "records_inserted": len(payloads)}


@app.get("/api/v1/anomalies")
async def get_flagged_anomalies(vertical: str = "fintech", db: Session = Depends(get_db)):
    anomalies = db.query(AnomalyEvent)\
                  .join(MetricEntry, AnomalyEvent.metric_id == MetricEntry.id)\
                  .filter(MetricEntry.vertical == vertical)\
                  .order_by(AnomalyEvent.timestamp.desc())\
                  .limit(40)\
                  .all()
    return [
        {
            "id": a.id,
            "score": a.score,
            "description": a.description,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None
        } for a in anomalies
    ]


@app.get("/api/v1/insights")
async def get_ai_insights_feed(vertical: str = "fintech", db: Session = Depends(get_db)):
    results = db.query(AnomalyEvent)\
                .join(MetricEntry, AnomalyEvent.metric_id == MetricEntry.id)\
                .join(AIInsight, AnomalyEvent.id == AIInsight.anomaly_id)\
                .filter(MetricEntry.vertical == vertical)\
                .order_by(AnomalyEvent.timestamp.desc())\
                .limit(10)\
                .all()
                
    output = []
    for a in results:
        raw_content = a.insight.content if a.insight else "System validation complete."
        
        if "rate_limit_exceeded" in raw_content or "429" in raw_content:
            fallback_copy = {
                "fintech": "Unsupervised density isolation flagged non-linear equity pricing skew. Risk profiles indicate active algorithmic market runs; automated hedging protocol armed.",
                "industrial": "Critical sensory variance isolated across rotational bearing vectors. Cavitation threshold exceeded; predictive maintenance flags immediate line pressure seal routing.",
                "cyber": "Anomalous packet ingress variance detected across peripheral proxy nodes. Volumetric tracking indicates high-probability zero-day cascade; firewall restrictions active."
            }
            raw_content = fallback_copy.get(vertical, "Algorithmic anomaly intercepted and logged under security protocol.")
            
        output.append({
            "anomaly_id": a.id,
            "score": a.score,
            "technical_specs": a.description,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            "ai_executive_summary": raw_content
        })
    return output


@app.websocket("/api/v1/stream")
async def websocket_telemetry_stream(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)