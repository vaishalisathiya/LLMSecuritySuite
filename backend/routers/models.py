from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_tenant_id
import models, schemas

router = APIRouter(prefix="/models", tags=["models"])


@router.get("/", response_model=list[schemas.LLMModelOut])
def list_models(
    tenant_id: int = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    return db.query(models.LLMModel).filter(models.LLMModel.tenant_id == tenant_id).all()


@router.post("/", response_model=schemas.LLMModelOut, status_code=201)
def create_model(
    body: schemas.LLMModelCreate,
    tenant_id: int = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    interface_type = "browser" if body.access_method.lower() == "browser" else "api"
    llm_model = models.LLMModel(
        tenant_id=tenant_id,
        interface_type=interface_type,
        **body.model_dump(),
    )
    db.add(llm_model)
    db.commit()
    db.refresh(llm_model)
    return llm_model


@router.delete("/{model_id}", status_code=204)
def delete_model(
    model_id: int,
    tenant_id: int = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    llm_model = db.query(models.LLMModel).filter(
        models.LLMModel.id == model_id, models.LLMModel.tenant_id == tenant_id
    ).first()
    if not llm_model:
        raise HTTPException(status_code=404, detail="Model not found")
    db.delete(llm_model)
    db.commit()
