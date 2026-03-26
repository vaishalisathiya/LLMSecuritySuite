from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/scans", tags=["scans"])


# --- Prompt routes first (must be before /{scan_id} to avoid int parse collision) ---

@router.post("/prompts/", response_model=schemas.PromptOut, status_code=201)
def create_prompt(body: schemas.PromptCreate, db: Session = Depends(get_db)):
    prompt = models.Prompt(**body.model_dump())
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt


@router.get("/prompts/", response_model=list[schemas.PromptOut])
def list_prompts(db: Session = Depends(get_db)):
    return db.query(models.Prompt).all()


# --- Scan (TestRun) routes ---

@router.post("/", response_model=schemas.TestRunOut, status_code=201)
def create_scan(body: schemas.TestRunCreate, db: Session = Depends(get_db)):
    prompt = db.query(models.Prompt).filter(models.Prompt.id == body.prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    test_run = models.TestRun(
        prompt_id=body.prompt_id,
        model_name=body.model_name,
        run_status="pending",
    )
    db.add(test_run)
    db.commit()
    db.refresh(test_run)
    return test_run


@router.get("/", response_model=list[schemas.TestRunOut])
def list_scans(db: Session = Depends(get_db)):
    return db.query(models.TestRun).order_by(models.TestRun.created_at.desc()).all()


@router.get("/{scan_id}", response_model=schemas.TestRunOut)
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    run = db.query(models.TestRun).filter(models.TestRun.id == scan_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Scan not found")
    return run


# --- Result routes ---

@router.post("/{scan_id}/results", response_model=schemas.ResultOut, status_code=201)
def create_result(scan_id: int, body: schemas.ResultCreate, db: Session = Depends(get_db)):
    run = db.query(models.TestRun).filter(models.TestRun.id == scan_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Scan not found")

    result = models.Result(test_run_id=scan_id, **body.model_dump())
    db.add(result)

    run.run_status = "completed"
    db.commit()
    db.refresh(result)
    return result


@router.get("/{scan_id}/results", response_model=list[schemas.ResultOut])
def get_scan_results(scan_id: int, db: Session = Depends(get_db)):
    run = db.query(models.TestRun).filter(models.TestRun.id == scan_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Scan not found")
    return db.query(models.Result).filter(models.Result.test_run_id == scan_id).all()
