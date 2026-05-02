from celery import Celery

celery_app = Celery(
    "app",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=["llm_interactions.celery.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
)