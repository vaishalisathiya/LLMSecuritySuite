import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI
from llm_interactions.routers import llm_browser

app = FastAPI(title="Browser LLM Service")

# Mount browser router
app.include_router(llm_browser.router)

# Optional health check
@app.get("/")
def health():
    return {"status": "ok"}