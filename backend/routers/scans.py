from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from collections import Counter
from database import get_db
from dependencies import get_tenant_id
import models, schemas

router = APIRouter(prefix="/scans", tags=["scans"])


# --- Prompt routes ---

@router.post("/prompts/", response_model=schemas.PromptOut, status_code=201)
def create_prompt(
    body: schemas.PromptCreate,
    tenant_id: int = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    prompt = models.Prompt(tenant_id=tenant_id, **body.model_dump())
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt


@router.get("/prompts/", response_model=list[schemas.PromptOut])
def list_prompts(
    tenant_id: int = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    return db.query(models.Prompt).filter(models.Prompt.tenant_id == tenant_id).all()


# --- Stats ---

@router.get("/stats/overview", response_model=schemas.StatsOverview)
def stats_overview(
    tenant_id: int = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    suites_q = db.query(models.TestSuite).filter(models.TestSuite.tenant_id == tenant_id)
    total_scans = suites_q.count()
    completed = suites_q.filter(models.TestSuite.run_status == "completed").count()
    pending = suites_q.filter(models.TestSuite.run_status == "pending").count()

    # Results scoped via test suites that belong to this tenant
    suite_ids = [s.id for s in suites_q.all()]
    results_q = db.query(models.Result).filter(models.Result.test_run_id.in_(suite_ids))
    total_results = results_q.count()
    vulnerable = results_q.filter(models.Result.vulnerability_detected == True).count()
    safe = results_q.filter(models.Result.vulnerability_detected == False).count()
    detection_rate = round((vulnerable / total_results * 100), 1) if total_results > 0 else 0.0

    suites = suites_q.all()
    all_prompt_ids = [pid for s in suites for pid in (s.prompt_id_list or [])]
    prompts = db.query(models.Prompt).filter(models.Prompt.id.in_(set(all_prompt_ids))).all()
    prompt_map = {p.id: p for p in prompts}

    category_counts = Counter(prompt_map[pid].category for pid in all_prompt_ids if pid in prompt_map)
    risk_counts = Counter(prompt_map[pid].risk_level for pid in all_prompt_ids if pid in prompt_map)

    by_severity = results_q.with_entities(models.Result.severity).all()
    severity_counts = Counter((r[0] or "none") for r in by_severity)

    vuln_result_ids = [
        r.prompt_id for r in results_q.filter(
            models.Result.vulnerability_detected == True,
            models.Result.prompt_id != None,
        ).all()
    ]
    vuln_prompts = db.query(models.Prompt).filter(models.Prompt.id.in_(set(vuln_result_ids))).all()
    vuln_prompt_map = {p.id: p for p in vuln_prompts}
    vuln_category_counts = Counter(vuln_prompt_map[pid].category for pid in vuln_result_ids if pid in vuln_prompt_map)

    return schemas.StatsOverview(
        total_scans=total_scans,
        completed=completed,
        pending=pending,
        total_results=total_results,
        vulnerable=vulnerable,
        safe=safe,
        detection_rate=detection_rate,
        by_category=[{"category": k, "count": v} for k, v in category_counts.items()],
        by_risk=[{"risk_level": k, "count": v} for k, v in risk_counts.items()],
        by_severity=[{"severity": k, "count": v} for k, v in severity_counts.items()],
        vuln_by_category=[{"category": k, "count": v} for k, v in vuln_category_counts.items()],
    )


# --- All results ---

@router.get("/results/all", response_model=list[schemas.ResultOut])
def get_all_results(
    tenant_id: int = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    suite_ids = [
        s.id for s in db.query(models.TestSuite.id)
        .filter(models.TestSuite.tenant_id == tenant_id)
        .all()
    ]
    return db.query(models.Result).filter(models.Result.test_run_id.in_(suite_ids)).all()


# --- TestSuite (scan) routes ---

@router.post("/", response_model=schemas.TestSuiteOut, status_code=201)
def create_scan(
    body: schemas.TestSuiteCreate,
    tenant_id: int = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    for pid in body.prompt_id_list:
        prompt = db.query(models.Prompt).filter(
            models.Prompt.id == pid, models.Prompt.tenant_id == tenant_id
        ).first()
        if not prompt:
            raise HTTPException(status_code=404, detail=f"Prompt {pid} not found")

    if not db.query(models.LLMModel).filter(
        models.LLMModel.id == body.model_id, models.LLMModel.tenant_id == tenant_id
    ).first():
        raise HTTPException(status_code=404, detail="Model not found")

    suite = models.TestSuite(
        tenant_id=tenant_id,
        prompt_id_list=body.prompt_id_list,
        model_id=body.model_id,
        run_status="pending",
    )
    db.add(suite)
    db.commit()
    db.refresh(suite)
    return suite


@router.get("/", response_model=list[schemas.TestSuiteOut])
def list_scans(
    tenant_id: int = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.TestSuite)
        .filter(models.TestSuite.tenant_id == tenant_id)
        .order_by(models.TestSuite.created_at.desc())
        .all()
    )


@router.get("/{scan_id}", response_model=schemas.TestSuiteOut)
def get_scan(
    scan_id: int,
    tenant_id: int = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    suite = db.query(models.TestSuite).filter(
        models.TestSuite.id == scan_id, models.TestSuite.tenant_id == tenant_id
    ).first()
    if not suite:
        raise HTTPException(status_code=404, detail="Scan not found")
    return suite


# --- Result routes ---

@router.post("/{scan_id}/results", response_model=schemas.ResultOut, status_code=201)
def create_result(
    scan_id: int,
    body: schemas.ResultCreate,
    tenant_id: int = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    suite = db.query(models.TestSuite).filter(
        models.TestSuite.id == scan_id, models.TestSuite.tenant_id == tenant_id
    ).first()
    if not suite:
        raise HTTPException(status_code=404, detail="Scan not found")

    result = models.Result(test_run_id=scan_id, **body.model_dump())
    db.add(result)
    suite.run_status = "completed"
    db.commit()
    db.refresh(result)
    return result


@router.get("/{scan_id}/results", response_model=list[schemas.ResultOut])
def get_scan_results(
    scan_id: int,
    tenant_id: int = Depends(get_tenant_id),
    db: Session = Depends(get_db),
):
    if not db.query(models.TestSuite).filter(
        models.TestSuite.id == scan_id, models.TestSuite.tenant_id == tenant_id
    ).first():
        raise HTTPException(status_code=404, detail="Scan not found")
    return db.query(models.Result).filter(models.Result.test_run_id == scan_id).all()
