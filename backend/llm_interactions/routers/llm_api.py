import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter
from llm_interactions.services.llm_api_services import run_api_llm
from schemas import LLMPromptRequest, LLMPromptResponse

router = APIRouter(prefix="/llm/api", tags=["llm-api"])

@router.post("/interact", response_model=LLMPromptResponse)
async def interact(body: LLMPromptRequest):
    return await run_api_llm(body)