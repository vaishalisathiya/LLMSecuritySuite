from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_tenant_id
import models, schemas

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/signup", response_model=schemas.SignupOut, status_code=201)
def signup(body: schemas.SignupRequest, db: Session = Depends(get_db)):
    """
    Register a new user. Supply either:
    - tenant_name  → creates a new tenant and registers the user as its first admin
    - tenant_id    → joins an existing tenant as a viewer (or whichever role is specified)
    """
    if not body.tenant_name and body.tenant_id is None:
        raise HTTPException(status_code=422, detail="Provide either tenant_name (new org) or tenant_id (existing org)")

    if body.tenant_name and body.tenant_id is not None:
        raise HTTPException(status_code=422, detail="Provide only one of tenant_name or tenant_id, not both")

    if body.tenant_name:
        tenant = models.Tenant(name=body.tenant_name)
        db.add(tenant)
        db.flush()
        tenant_id = tenant.id
        role = "admin"  # First user of a new tenant is admin
    else:
        tenant_id = body.tenant_id
        if not db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first():
            raise HTTPException(status_code=404, detail="Tenant not found")
        role = body.role

    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = models.User(tenant_id=tenant_id, name=body.name, email=body.email, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.SignupOut(
        user_id=user.id,
        tenant_id=tenant_id,
        name=user.name,
        email=user.email,
        role=user.role,
    )


@router.get("/", response_model=list[schemas.UserOut])
def list_users(
    tenant_id: int = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    return db.query(models.User).filter(models.User.tenant_id == tenant_id).all()


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(
    user_id: int,
    tenant_id: int = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(models.User.id == user_id, models.User.tenant_id == tenant_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
