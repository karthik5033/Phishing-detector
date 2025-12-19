from fastapi import APIRouter, Depends, HTTPException
from app.schemas.analysis import AnalysisRequest, AnalysisResponse, RiskLevel
from app.services.inference import get_inference_service, InferenceService
from app.services.temporal import analyze_temporal_risk
from app.services.impersonation import analyze_impersonation
import hashlib
import uuid

router = APIRouter(prefix="/api/v1", tags=["analysis"])

def get_risk_level(score: float) -> RiskLevel:
    if score >= 0.7:
        return RiskLevel.HIGH_RISK
    elif score >= 0.4:
        return RiskLevel.SUSPICIOUS
    return RiskLevel.SAFE

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_message(
    request: AnalysisRequest, 
    service: InferenceService = Depends(get_inference_service)
):
    try:
        # Note: We do NOT persist request.text or request.url
        results = service.analyze_text(request.text)
        
        # Temporal Analysis
        temporal_multiplier, temporal_warning = analyze_temporal_risk(
            request.local_hour, 
            request.day_of_week, 
            results["max_risk_score"]
        )
        
        max_score = min(results["max_risk_score"] * temporal_multiplier, 1.0)
        risk_lvl = get_risk_level(max_score)
        
        # Simple rule-based explanation
        explanation = f"Content analysis indicates {risk_lvl.value.lower().replace('_', ' ')} behavior."
        if max_score > 0.6:
            explanation += " High urgency or authority patterns detected."
            
        if temporal_warning:
            explanation += f" {temporal_warning}"

        # Impersonation Analysis (Module 3)
        imp_risk_add, imp_warning = analyze_impersonation(request.page_title, request.url)
        max_score = min(max_score + imp_risk_add, 1.0)
        
        # If impersonation detected, force High Risk
        if imp_risk_add > 0:
             risk_lvl = RiskLevel.HIGH_RISK
             explanation = imp_warning # Override explanation with the most critical finding
        else:
             risk_lvl = get_risk_level(max_score)

        return AnalysisResponse(
            max_risk_score=max_score,
            risk_level=risk_lvl,
            detections=results["detections"],
            explanation=explanation,
            request_id=str(uuid.uuid4())
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
