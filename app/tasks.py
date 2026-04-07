from app.celery_app import celery_app
from app.evaluator import evaluate_response
import time
import random
import requests
import os

BROWSER_LLM_URL = os.getenv("BROWSER_LLM_URL", "http://localhost:8001")
@celery_app.task(name="app.tasks.run_llm_task")
def run_llm_task(prompt, llm_info):

    if llm_info["type"] == 0:
        #Add all the necessary logic to call the correct LLM
        
        
        result = f"API response to: {prompt['prompt']}"
    else:
        #Add all the necessary logic to call the correct LLM
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