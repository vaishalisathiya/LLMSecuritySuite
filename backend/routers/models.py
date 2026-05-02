from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/models", tags=["models"])

DEFAULT_TENANT_ID = 1


@router.get("/", response_model=list[schemas.LLMModelOut])
def list_models(db: Session = Depends(get_db)):
    return db.query(models.LLMModel).all()


@router.post("/", response_model=schemas.LLMModelOut, status_code=201)
def create_model(body: schemas.LLMModelCreate, db: Session = Depends(get_db)):
    llm_model = models.LLMModel(
        tenant_id=DEFAULT_TENANT_ID,
        **body.model_dump(),
    )
    db.add(llm_model)
    db.commit()
    db.refresh(llm_model)
    return llm_model


@router.delete("/{model_id}", status_code=204)
def delete_model(model_id: int, db: Session = Depends(get_db)):
    llm_model = db.query(models.LLMModel).filter(models.LLMModel.id == model_id).first()
    if not llm_model:
        raise HTTPException(status_code=404, detail="Model not found")
    db.delete(llm_model)
    db.commit()
