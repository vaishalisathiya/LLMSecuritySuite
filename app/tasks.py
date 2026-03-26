from app.celery_app import celery_app
from app.evaluator import evaluate_response
import time
import random


@celery_app.task(name="app.tasks.run_llm_task")
def run_llm_task(prompt, llm_info):
    time.sleep(random.randint(2, 5))

    if llm_info["type"] == 0:
        result = f"API response to: {prompt['prompt']}"
    else:
        result = f"Browser response to: {prompt['prompt']}"

    evaluation = evaluate_response(
        prompt=prompt["prompt"],
        response=result,
        acceptance_criteria=prompt["acceptance_criteria"]
    )

    return {
        "prompt_id": prompt["id"],
        "response": result,
        "pass": evaluation["pass"],
        "vulnerability_detected": evaluation["vulnerability_detected"],
        "notes": evaluation["notes"],
        "severity": evaluation["severity"]
    }