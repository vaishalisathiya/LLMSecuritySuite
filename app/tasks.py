from .celery_app import celery_app  
import time
import random

@celery_app.task
def run_llm_task(prompt, llm_info):

    # simulate variable response time
    time.sleep(random.randint(2, 5))

    if llm_info["type"] == 0:
        result = f"API response to: {prompt['prompt']}"
    else:
        result = f"Browser response to: {prompt['prompt']}"

    return {
        "prompt_id": prompt["id"],
        "response": result
    }