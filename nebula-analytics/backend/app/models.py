from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class MetricEntry(Base):
    """Unified storage layer for multi-tenant enterprise telemetry arrays."""
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True)
    vertical = Column(String, default="fintech", index=True) # fintech, industrial, cyber
    entity = Column(String, index=True)                      # e.g., AAPL, TURBINE_04, PROXY_SERVER_01
    metric_name = Column(String, index=True)                 # e.g., market_price, hydraulic_pressure, api_latency
    value = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationship anchor linking downstream anomalies
    anomalies = relationship("AnomalyEvent", back_populates="metric", cascade="all, delete-orphan")

class AnomalyEvent(Base):
    """Tracks unsupervised machine learning isolation breaks across all verticals."""
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    metric_id = Column(Integer, ForeignKey("metrics.id", ondelete="CASCADE"), index=True)
    score = Column(Float)
    description = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Cross-linkage backing points
    metric = relationship("MetricEntry", back_populates="anomalies")
    insight = relationship("AIInsight", back_populates="anomaly", uselist=False, cascade="all, delete-orphan")

class AIInsight(Base):
    """Stores low-latency Groq LLM structural forensics diagnostics."""
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    anomaly_id = Column(Integer, ForeignKey("anomalies.id", ondelete="CASCADE"), unique=True, index=True)
    content = Column(String)

    anomaly = relationship("AnomalyEvent", back_populates="insight")