from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.llm import get_llm_service, LlmService

router = APIRouter(prefix="/api/v1", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = ""

class ChatResponse(BaseModel):
    response: str
    suggestions: List[str]

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    service: LlmService = Depends(get_llm_service)
):
    result = await service.chat_with_context(request.message, request.context)
    return ChatResponse(
        response=result["response"],
        suggestions=result["suggestions"]
    )
