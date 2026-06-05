import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session
from app.models import MetricEntry, AnomalyEvent, AIInsight
from app.llm_service import InsightGenerator  # <--- New Import

# Initialize our abstracted AI Core driver interface
ai_core = InsightGenerator()

# Change the function definition at the top of app/ml_engine.py to:
def detect_and_log_anomalies(db: Session, entity: str, vertical: str, lookback_records: int = 100):
    """
    Partitions training data based on the active vertical before deploying 
    unsupervised Isolation Forest calculations.
    """
    # 1. Fetch records tied strictly to this vertical channel partitions
    records = db.query(MetricEntry)\
                .filter(MetricEntry.vertical == vertical, MetricEntry.entity == entity)\
                .order_by(MetricEntry.timestamp.desc())\
                .limit(lookback_records * 2)\
                .all()

    if len(records) < 20:
        return

    # 2. Map and pivot co-dependent parameters dynamically based on vertical fields
    grouped = {}
    for r in records:
        if r.timestamp not in grouped:
            grouped[r.timestamp] = {}
        grouped[r.timestamp][r.metric_name] = r.value

    data_list = []
    # Identify feature sets dynamically
    feature_keys = {
        "fintech": ("market_price", "transaction_volume"),
        "industrial": ("hydraulic_pressure", "structural_vibration"),
        "cyber": ("api_latency", "network_ingress")
    }.get(vertical)

    f1, f2 = feature_keys

    for ts, metrics in grouped.items():
        if f1 in metrics and f2 in metrics:
            data_list.append({
                "timestamp": ts,
                "feature_1": metrics[f1],
                "feature_2": metrics[f2]
            })

    df = pd.DataFrame(data_list)
    if len(df) < 10:
        return

    X = df[["feature_1", "feature_2"]].values
    # 3. Fit Isolation Forest Unsupervised Model
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(X)

    df["anomaly_marker"] = model.predict(X)
    df["anomaly_score"] = model.decision_function(X)

    latest_frame = df.sort_values(by="timestamp", ascending=False).iloc[0]

    if latest_frame["anomaly_marker"] == -1:
        # Prevent logging collision states by identifying linked elements across timestamps
        # Locate the exact parent record to reference our relational ForeignKey mapping constraint
        parent_metric = db.query(MetricEntry).filter(
            MetricEntry.vertical == vertical,
            MetricEntry.entity == entity,
            MetricEntry.timestamp == latest_frame["timestamp"]
        ).first()

        if parent_metric:
            existing = db.query(AnomalyEvent).filter(AnomalyEvent.metric_id == parent_metric.id).first()
            if not existing:
                raw_score = abs(latest_frame["anomaly_score"]) * 10.0
                
                new_anomaly = AnomalyEvent(
                    metric_id=parent_metric.id,
                    score=round(raw_score, 2),
                    description=f"Multi-variable structural break on {vertical}. Field_1: {latest_frame['feature_1']}, Field_2: {latest_frame['feature_2']}",
                    timestamp=latest_frame["timestamp"]
                )
                db.add(new_anomaly)
                db.commit()
                db.refresh(new_anomaly)

                print(f"🚨 [CORE INTERCEPT] {vertical.upper()} Anomaly Isolated! Score: {new_anomaly.score}")

                # 4. Synthesize diagnostic text payload packets via adapted Groq prompting
                context_payload = {
                    "entity": entity,
                    "metric_name": f"{f1} // {f2} Correlation Vector",
                    "anomaly_score": new_anomaly.score,
                    "raw_description": new_anomaly.description,
                    "timestamp": new_anomaly.timestamp.strftime("%Y-%m-%d %H:%M:%S")
                }
                
                ai_text_insight = ai_core.generate_executive_summary(context_payload, vertical=vertical)
                print(f"✨ [AI TERMINAL] Diagnostic Generated:\n\"{ai_text_insight}\"\n")

                # 4. Commit the text insight into the relational database
                insight_entry = AIInsight(
                    anomaly_id=new_anomaly.id,
                    content=ai_text_insight
                )
                db.add(insight_entry)
                db.commit()