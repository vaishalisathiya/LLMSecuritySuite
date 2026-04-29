from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from uuid import uuid4
import json
import time

from celery.result import AsyncResult
from .models import LLM_TEST_REQUEST
from .tasks import run_llm_task

# in-memory job store (for demo)
jobs = {}

app = FastAPI()

# start job endpoint
@app.post("/start-job")
def start_job(request: LLM_TEST_REQUEST):
    job_id = str(uuid4())
    task_ids = []

    for prompt in request.prompts:
        task = run_llm_task.delay(
            prompt.dict(),
            request.llm_info.dict()
        )
        task_ids.append(task.id)

    jobs[job_id] = task_ids
    return {"job_id": job_id}

# stream results endpoint
@app.get("/stream/{job_id}")
def stream_results(job_id: str):
    def event_stream():
        task_ids = jobs.get(job_id, [])
        completed = set()

        while len(completed) < len(task_ids):
            for task_id in task_ids:
                if task_id in completed:
                    continue
                result = AsyncResult(task_id)
                if result.ready():
                    completed.add(task_id)
                    yield f"data: {json.dumps(result.result)}\n\n"
            time.sleep(1)

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")