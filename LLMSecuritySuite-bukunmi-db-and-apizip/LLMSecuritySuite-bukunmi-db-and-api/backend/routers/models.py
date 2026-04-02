from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/models", tags=["models"])


@router.post("/", response_model=schemas.ModelOut, status_code=201)
def create_model(body: schemas.ModelCreate, db: Session = Depends(get_db)):
    model = models.Model(**body.model_dump())
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


@router.get("/", response_model=list[schemas.ModelOut])
def list_models(db: Session = Depends(get_db)):
    return db.query(models.Model).all()


@router.get("/{model_id}", response_model=schemas.ModelOut)
def get_model(model_id: int, db: Session = Depends(get_db)):
    model = db.query(models.Model).filter(models.Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@router.delete("/{model_id}", status_code=204)
def delete_model(model_id: int, db: Session = Depends(get_db)):
    model = db.query(models.Model).filter(models.Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    db.delete(model)
    db.commit()
