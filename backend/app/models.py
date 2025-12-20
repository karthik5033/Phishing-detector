from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from .database import Base

class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, index=True)
    domain = Column(String, index=True)
    risk_score = Column(Float)
    risk_level = Column(String)  # SAFE, SUSPICIOUS, HIGH_RISK
    explanation = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
