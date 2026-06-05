import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session
from app.models import MetricEntry, AnomalyEvent, AIInsight
from app.llm_service import InsightGenerator  # <--- New Import

# Initialize our abstracted AI Core driver interface
ai_core = InsightGenerator(provider="groq")

def detect_and_log_anomalies(db: Session, entity: str = "AAPL", lookback_records: int = 100):
    records = db.query(MetricEntry)\
                .filter(MetricEntry.entity == entity)\
                .order_by(MetricEntry.timestamp.desc())\
                .limit(lookback_records * 2)\
                .all()

    if len(records) < 20:
        return

    grouped = {}
    for r in records:
        if r.timestamp not in grouped:
            grouped[r.timestamp] = {}
        grouped[r.timestamp][r.metric_name] = r.value

    data_list = []
    for ts, metrics in grouped.items():
        if "market_price" in metrics and "transaction_volume" in metrics:
            data_list.append({
                "timestamp": ts,
                "price": metrics["market_price"],
                "volume": metrics["transaction_volume"]
            })

    df = pd.DataFrame(data_list)
    if len(df) < 10:
        return

    X = df[["price", "volume"]].values
    model = IsolationForest(contamination=0.04, random_state=42)
    model.fit(X)

    df["anomaly_marker"] = model.predict(X)
    df["anomaly_score"] = model.decision_function(X)

    latest_frame = df.sort_values(by="timestamp", ascending=False).iloc[0]

    if latest_frame["anomaly_marker"] == -1:
        existing = db.query(AnomalyEvent).filter(AnomalyEvent.timestamp == latest_frame["timestamp"]).first()
        if not existing:
            raw_score = abs(latest_frame["anomaly_score"]) * 10.0
            
            # 1. Save the core anomaly event row frame
            new_anomaly = AnomalyEvent(
                score=round(raw_score, 2),
                description=f"Multi-variable structural break detected. Price: {latest_frame['price']}, Vol: {latest_frame['volume']}",
                timestamp=latest_frame["timestamp"]
            )
            db.add(new_anomaly)
            db.commit()
            db.refresh(new_anomaly)  # Extract the newly generated anomaly primary ID key
            
            print(f"🚨 [ML ALARM] Isolation Forest Flagged An Anomaly! Score: {new_anomaly.score}")
            
            # 2. Compile structural context payload packets for the AI Core
            context_payload = {
                "entity": entity,
                "metric_name": "Market Price & Transaction Volume Cluster",
                "anomaly_score": new_anomaly.score,
                "raw_description": new_anomaly.description,
                "timestamp": new_anomaly.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            }
            
            # 3. Intercept via Groq Low-Latency Engine
            print("🧠 [AI CORE] Transmitting context to Groq API layer for real-time diagnostic synthesis...")
            ai_text_insight = ai_core.generate_executive_summary(context_payload)
            print(f"✨ [AI CORE] Diagnostic Received:\n\"{ai_text_insight}\"")
            
            # 4. Commit the text insight into the relational database
            insight_entry = AIInsight(
                anomaly_id=new_anomaly.id,
                content=ai_text_insight
            )
            db.add(insight_entry)
            db.commit()