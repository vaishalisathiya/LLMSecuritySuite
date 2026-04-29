from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.post("/", response_model=schemas.TenantOut, status_code=201)
def create_tenant(body: schemas.TenantCreate, db: Session = Depends(get_db)):
    tenant = models.Tenant(name=body.name)
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.get("/", response_model=list[schemas.TenantOut])
def list_tenants(db: Session = Depends(get_db)):
    return db.query(models.Tenant).all()


@router.get("/{tenant_id}", response_model=schemas.TenantOut)
def get_tenant(tenant_id: int, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant
