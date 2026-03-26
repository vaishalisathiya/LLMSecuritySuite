from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import scans, users

app = FastAPI(title="LLM Security Suite API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(scans.router)


@app.get("/health")
def health():
    return {"status": "ok"}
