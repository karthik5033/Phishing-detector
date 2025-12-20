from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import ScanResult
from typing import Dict, Any, List
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/v1", tags=["stats"])

@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard_stats(db: Session = Depends(get_db)):
    # 1. KPI: Total Scans
    total_scans = db.query(ScanResult).count()

    # 2. KPI: Threats Blocked (High Risk + Suspicious)
    # Assuming anything >= 0.4 is "actionable"
    blocked_count = db.query(ScanResult).filter(
        ScanResult.risk_score >= 0.4
    ).count()

    critical_count = db.query(ScanResult).filter(
        ScanResult.risk_level == "HIGH_RISK"
    ).count()

    # 3. Recent Interventions (Latest 5 Risky)
    recent_risks = db.query(ScanResult).filter(
        ScanResult.risk_score >= 0.4
    ).order_by(ScanResult.timestamp.desc()).limit(5).all()

    recent_data = [
        {
            "domain": r.domain,
            "timestamp": r.timestamp.isoformat(), # Send raw ISO for frontend to format
            "type": "Phishing" if "Impersonation" in (r.explanation or "") else "Social Eng.",
            "risk": r.risk_level.replace("_", " "),
            "score": r.risk_score
        }
        for r in recent_risks
    ]

    # 4. Activity Trend (Last 7 days mock or real aggregated)
    # Real aggregation:
    end_date = datetime.now()
    start_date = end_date - timedelta(days=6)
    
    daily_stats = db.query(
        func.date(ScanResult.timestamp).label('date'),
        func.count(ScanResult.id).label('count')
    ).filter(
        ScanResult.timestamp >= start_date
    ).group_by(
        func.date(ScanResult.timestamp)
    ).all()

    # Convert to dictionary for easy lookup
    stats_map = {str(d.date): d.count for d in daily_stats}
    
    # Fill gaps with 0
    trend_data = []
    for i in range(7):
        day = start_date + timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        trend_data.append({
            "date": day.strftime("%a"), # Mon, Tue...
            "count": stats_map.get(day_str, 0)
        })

    return {
        "kpi": {
            "total_scans": total_scans,
            "threats_blocked": blocked_count,
            "critical_blocked": critical_count,
            "safety_score": 100 - (critical_count * 5) # Simple heuristic logic
        },
        "recent_interventions": recent_data,
        "activity_trend": trend_data
    }

@router.get("/activity", response_model=List[Dict[str, Any]])
async def get_activity_log(
    limit: int = 50, 
    offset: int = 0, 
    db: Session = Depends(get_db)
):
    scans = db.query(ScanResult).order_by(
        ScanResult.timestamp.desc()
    ).offset(offset).limit(limit).all()

    activity_log = []
    for s in scans:
        # Infer category from explanation or risk
        category = "General"
        explanation = (s.explanation or "").lower()
        
        if "impersonation" in explanation or "typosquatting" in explanation or "homoglyph" in explanation:
            category = "Phishing"
        elif "urgency" in explanation or "social engineering" in explanation:
            category = "Social Eng."
        elif s.risk_score > 0.7:
            category = "Critical"
        elif s.risk_score < 0.1:
            category = "Safe"

        activity_log.append({
            "id": s.id,
            "domain": s.domain,
            "timestamp": f"{s.timestamp.isoformat()}Z" if s.timestamp else datetime.utcnow().isoformat() + "Z",
            "risk_score": s.risk_score,
            "risk_level": s.risk_level,
            "status": "BLOCKED" if s.risk_score > 0.8 else ("WARNED" if s.risk_score > 0.5 else "SAFE"),
            "category": category
        })
    
    return activity_log
