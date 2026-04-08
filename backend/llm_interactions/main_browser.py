from fastapi import FastAPI
from routers import llm_browser

app = FastAPI(title="Browser LLM Service")

# Mount browser router
app.include_router(llm_browser.router)

# Optional health check
@app.get("/")
def health():
    return {"status": "ok"}