from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from uuid import uuid4
import json
import asyncio
import time

from app.celery_app import celery_app
from app.models import LLM_TEST_REQUEST
from app.tasks import run_llm_task

#temporary just for testing, we should move this from in memory to redis when possible
jobs = {}

app = FastAPI()


@app.post("/start-job")
def start_job(request: LLM_TEST_REQUEST):
    job_id = str(uuid4())
    task_ids = []

    for prompt in request.prompts:
        task = run_llm_task.delay(
            prompt.model_dump(),
            request.llm_info.model_dump()
        )
        task_ids.append(task.id)

    jobs[job_id] = task_ids
    return {"job_id": job_id}


@app.get("/stream/{job_id}")
async def stream_results(job_id: str):
    async def event_stream():
        task_ids = jobs.get(job_id, [])
        completed = set()

        while len(completed) < len(task_ids):
            for task_id in task_ids:
                if task_id in completed:
                    continue

                result = celery_app.AsyncResult(task_id)

                if result.state == "SUCCESS":
                    completed.add(task_id)
                    if result.result is not None:
                        yield f"data: {json.dumps(result.result)}\n\n"

                elif result.state == "FAILURE":
                    completed.add(task_id)
                    yield f"data: {json.dumps({'task_id': task_id, 'error': str(result.result)})}\n\n"

            await asyncio.sleep(1)

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")