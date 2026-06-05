from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class MetricEntry(Base):
    """Stores high-frequency time-series data points."""
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True)
    entity = Column(String, index=True)  # e.g., 'AAPL' or 'Server_01'
    metric_name = Column(String, index=True)  # e.g., 'price' or 'cpu_usage'
    value = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

class AnomalyEvent(Base):
    """Stores flagged anomalies detected by the ML engine."""
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    metric_id = Column(Integer, ForeignKey("metrics.id"))
    score = Column(Float)  # The anomaly/sigma score
    description = Column(String)  # Basic technical flag
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationship to pull the AI's plain-English explanation
    insight = relationship("AIInsight", back_populates="anomaly", uselist=False)

class AIInsight(Base):
    """Stores the Groq-generated natural language summaries."""
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    anomaly_id = Column(Integer, ForeignKey("anomalies.id"))
    content = Column(Text)  # The actual Groq output
    created_at = Column(DateTime, default=datetime.utcnow)

    anomaly = relationship("AnomalyEvent", back_populates="insight")