from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models, schemas

router = APIRouter(prefix="/scans", tags=["scans"])

DEFAULT_TENANT_ID = 1


# --- Prompt routes (must be before /{scan_id} to avoid int parse collision) ---

@router.post("/prompts/", response_model=schemas.PromptOut, status_code=201)
def create_prompt(body: schemas.PromptCreate, db: Session = Depends(get_db)):
    prompt = models.Prompt(tenant_id=DEFAULT_TENANT_ID, **body.model_dump())
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt


@router.get("/prompts/", response_model=list[schemas.PromptOut])
def list_prompts(db: Session = Depends(get_db)):
    return db.query(models.Prompt).all()


# --- Stats ---

@router.get("/stats/overview", response_model=schemas.StatsOverview)
def stats_overview(db: Session = Depends(get_db)):
    total_scans = db.query(models.TestRun).count()
    completed = db.query(models.TestRun).filter(models.TestRun.run_status == "completed").count()
    pending = db.query(models.TestRun).filter(models.TestRun.run_status == "pending").count()
    total_results = db.query(models.Result).count()
    vulnerable = db.query(models.Result).filter(models.Result.vulnerability_detected == True).count()
    safe = db.query(models.Result).filter(models.Result.vulnerability_detected == False).count()
    detection_rate = round((vulnerable / total_results * 100), 1) if total_results > 0 else 0.0

    by_category = (
        db.query(models.Prompt.category, func.count(models.TestRun.id).label("count"))
        .join(models.TestRun, models.TestRun.prompt_id == models.Prompt.id)
        .group_by(models.Prompt.category)
        .all()
    )

    by_risk = (
        db.query(models.Prompt.risk_level, func.count(models.TestRun.id).label("count"))
        .join(models.TestRun, models.TestRun.prompt_id == models.Prompt.id)
        .group_by(models.Prompt.risk_level)
        .all()
    )

    by_severity = (
        db.query(models.Result.severity, func.count(models.Result.id).label("count"))
        .group_by(models.Result.severity)
        .all()
    )

    vuln_by_category = (
        db.query(models.Prompt.category, func.count(models.Result.id).label("count"))
        .join(models.TestRun, models.TestRun.prompt_id == models.Prompt.id)
        .join(models.Result, models.Result.test_run_id == models.TestRun.id)
        .filter(models.Result.vulnerability_detected == True)
        .group_by(models.Prompt.category)
        .all()
    )

    return schemas.StatsOverview(
        total_scans=total_scans,
        completed=completed,
        pending=pending,
        total_results=total_results,
        vulnerable=vulnerable,
        safe=safe,
        detection_rate=detection_rate,
        by_category=[{"category": r[0], "count": r[1]} for r in by_category],
        by_risk=[{"risk_level": r[0], "count": r[1]} for r in by_risk],
        by_severity=[{"severity": r[0] or "none", "count": r[1]} for r in by_severity],
        vuln_by_category=[{"category": r[0], "count": r[1]} for r in vuln_by_category],
    )


# --- All results ---

@router.get("/results/all", response_model=list[schemas.ResultOut])
def get_all_results(db: Session = Depends(get_db)):
    return db.query(models.Result).all()


# --- Scan (TestRun) routes ---

@router.post("/", response_model=schemas.TestRunOut, status_code=201)
def create_scan(body: schemas.TestRunCreate, db: Session = Depends(get_db)):
    prompt = db.query(models.Prompt).filter(models.Prompt.id == body.prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    llm_model = db.query(models.LLMModel).filter(models.LLMModel.id == body.model_id).first()
    if not llm_model:
        raise HTTPException(status_code=404, detail="Model not found")

    test_run = models.TestRun(
        tenant_id=DEFAULT_TENANT_ID,
        prompt_id=body.prompt_id,
        model_id=body.model_id,
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
