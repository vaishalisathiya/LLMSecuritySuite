from fastapi import APIRouter
from services.llm_api_services import run_api_llm
import schemas

router = APIRouter(prefix="/llm/api", tags=["llm-api"])

@router.post("/interact", response_model=schemas.LLMInteractResponse)
async def interact(body: schemas.LLMInteractRequest):
    response = await run_api_llm(body)
    return schemas.LLMInteractResponse(
        response=response,
        provider=body.provider,
        model=body.model
    )