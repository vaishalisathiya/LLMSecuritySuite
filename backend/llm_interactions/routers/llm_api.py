from fastapi import APIRouter
from services.llm_api_services import run_api_llm
from LLMSecuritySuite.backend.schemas import LLMPromptRequest, LLMPromptResponse

router = APIRouter(prefix="/llm/api", tags=["llm-api"])

@router.post("/interact", response_model=LLMPromptResponse)
async def interact(body: LLMPromptRequest):
    return await run_api_llm(body)