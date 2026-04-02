from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import scans, users, models as models_router
import models as db_models
from database import engine

db_models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="LLM Security Suite API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(models_router.router)
app.include_router(scans.router)


@app.get("/health")
def health():
    return {"status": "ok"}
