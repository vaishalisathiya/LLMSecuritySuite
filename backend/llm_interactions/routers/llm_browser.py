from fastapi import APIRouter, HTTPException
from services.llm_browser_services import run_browser_llm

router = APIRouter(prefix="/llm/browser", tags=["llm-browser"])

@router.post("/run")
def run(data: dict):
    try:
        return {"response": run_browser_llm(data["prompt"], data["llm_info"])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))