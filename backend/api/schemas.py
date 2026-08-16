from pydantic import BaseModel
from typing import List, Dict

class URLRequest(BaseModel):
    url: str

class DetectionResponse(BaseModel):
    url: str
    is_phishing: bool
    confidence_score: float
    max_risk_score: float  # Added for Extension Compatibility
    risk_level: str
    heuristics: dict

class DailyCount(BaseModel):
    date: str
    count: int

class GlobalStatsResponse(BaseModel):
    total_scans: int
    threats_blocked: int
    common_patterns: Dict[str, int]
    recent_trend: List[DailyCount]

class DomainRequest(BaseModel):
    domain: str

class ChatRequest(BaseModel):
    message: str
    context: str = ""

class UrlUpdate(BaseModel):
    url: str
