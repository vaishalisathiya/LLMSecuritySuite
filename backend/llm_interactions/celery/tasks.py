from LLMSecuritySuite.backend.llm_interactions.celery.celery_app import celery_app
from LLMSecuritySuite.backend.llm_interactions.evaluator import evaluate_response
from LLMSecuritySuite.backend.llm_interactions.services.llm_api_services import run_api_llm

import time
import random
import requests
import os
import asyncio

API_LLM_URL = "http://localhost:8002/llm/api/run"
BROWSER_LLM_URL = os.getenv("BROWSER_LLM_URL", "http://localhost:8001")
@celery_app.task(name="app.tasks.run_llm_task")
def run_llm_task(prompt, llm_info):

    if llm_info["type"] == 0:
        result = asyncio.run(
                run_api_llm(
                    prompt=prompt["prompt"],
                    provider=llm_info.get("provider"),
                    model=llm_info.get("model"),
                    api_key=llm_info.get("api_key"),
                    endpoint=llm_info.get("endpoint") 
                )
            )
    else:        
        try:
            res = requests.post(
                f"{BROWSER_LLM_URL}/run",
                json={
                    "prompt": prompt,
                    "llm_info": llm_info
                },
                timeout=300
            )

            res.raise_for_status()
            result = res.json().get("response", "")

        except Exception as e:
            result = f"ERROR: Browser LLM request failed: {str(e)}"

    evaluation = evaluate_response(
        prompt=prompt["prompt"],
        response=result,
        vulnerability_criteria=prompt["acceptance_criteria"]
    )

    #once we get to integrating, we should place our logic to store this in the database here probably

    return {
        "prompt_id": prompt["id"],
        "vulnerability_detected": evaluation["vulnerability_detected"],
        "notes": evaluation["notes"],
        "confidence": evaluation["confidence"],
        "response": evaluation["response"],
        "acceptance_criteria": evaluation["acceptance_criteria"],
    }