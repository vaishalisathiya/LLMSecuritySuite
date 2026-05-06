import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from llm_interactions.celery.celery_app import celery_app
from llm_interactions.evaluator import evaluate_response
from llm_interactions.services.llm_api_services import run_api_llm
from schemas import LLMPromptRequest, LLMPromptResponse
from fastapi import HTTPException

import requests
import asyncio

BROWSER_LLM_URL = os.getenv("BROWSER_LLM_URL", "http://localhost:8003")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8001")


@celery_app.task(name="app.tasks.run_llm_task")
def run_llm_task(request: dict):
    llm_request = LLMPromptRequest(**request)
    access_method = llm_request.model.access_method.lower()
    try:
        if access_method == "api":
            try:
                llm_response: LLMPromptResponse = asyncio.run(run_api_llm(llm_request))
            except HTTPException as e:
                raise RuntimeError(f"LLM API call failed (HTTP {e.status_code}): {e.detail}")

        else:
            try:
                res = requests.post(
                    f"{BROWSER_LLM_URL}/llm/browser/interact",
                    json=llm_request.model_dump(),
                    timeout=300
                )
                res.raise_for_status()
                llm_response = LLMPromptResponse(**res.json())
            except requests.HTTPError as e:
                # The browser service returned a 4xx/5xx — pull the detail out of the response body
                try:
                    detail = e.response.json().get("detail", e.response.text)
                except Exception:
                    detail = e.response.text
                raise RuntimeError(f"Browser LLM service error ({e.response.status_code}): {detail}")
            except requests.ConnectionError:
                raise RuntimeError(f"Could not connect to browser LLM service at {BROWSER_LLM_URL}")
            except requests.Timeout:
                raise RuntimeError("Browser LLM service timed out after 300s")

        # --- Evaluate ---
        evaluation = evaluate_response(
            prompt=llm_request.prompt.input_text,
            response=llm_response.response,
            vulnerability_criteria=llm_request.prompt.acceptance_criteria
        )

        # --- Persist to backend ---
        if llm_request.scan_id:
            try:
                requests.post(
                    f"{BACKEND_URL}/scans/{llm_request.scan_id}/results",
                    json={
                        "prompt_id": llm_request.prompt.prompt_id,
                        "output_text": evaluation["response"],
                        "vulnerability_detected": evaluation["vulnerability_detected"],
                        "notes": evaluation["notes"],
                        "confidence": evaluation["confidence"],
                        "acceptance_criteria": evaluation["acceptance_criteria"],
                    },
                    headers={"X-Tenant-ID": "1"},
                    timeout=30
                )
            except Exception as e:
                print(f"Failed to save result to backend: {e}")

        return {
            "vulnerability_detected": evaluation["vulnerability_detected"],
            "notes": evaluation["notes"],
            "confidence": evaluation["confidence"],
            "response": evaluation["response"],
            "acceptance_criteria": evaluation["acceptance_criteria"],
        }
    except Exception as e:
        if llm_request.scan_id:
            try:
                requests.patch(
                    f"{BACKEND_URL}/scans/{llm_request.scan_id}/status",
                    params={"status": "failed"},
                    headers={"X-Tenant-ID": "1"},
                    timeout=10
                )
            except Exception:
                pass
        raise  #re-raise so Celery still marks the task as FAILURE