import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, HTTPException
from llm_interactions.services.llm_browser_services import run_browser_llm
from schemas import LLMPromptRequest, LLMPromptResponse
import asyncio

router = APIRouter(prefix="/llm/browser", tags=["llm-browser"])

@router.post("/interact", response_model=LLMPromptResponse)
async def interact(body: LLMPromptRequest):
    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, run_browser_llm, body)
        return LLMPromptResponse(
            response=response,
            provider=body.model.provider,
            model=body.model.model_identifier
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))