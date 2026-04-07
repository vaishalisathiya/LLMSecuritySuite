from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# --- User ---

class UserOut(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


# --- Model ---

class LLMModelCreate(BaseModel):
    name: str
    provider: str
    model_type: str
    access_method: str
    credential_reference: Optional[str] = None


class LLMModelOut(BaseModel):
    id: int
    name: str
    provider: str
    model_type: str
    access_method: str
    credential_reference: Optional[str]

    class Config:
        from_attributes = True


# --- Prompt ---

class PromptCreate(BaseModel):
    input_text: str
    category: str
    risk_level: str
    created_by: int


class PromptOut(BaseModel):
    id: int
    input_text: str
    category: str
    risk_level: str
    created_by: Optional[int]

    class Config:
        from_attributes = True


# --- Test Run ---

class TestRunCreate(BaseModel):
    prompt_id: int
    model_id: int


class TestRunOut(BaseModel):
    id: int
    prompt_id: int
    model_id: int
    run_status: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- Result ---

class ResultCreate(BaseModel):
    output_text: Optional[str] = None
    vulnerability_detected: bool
    detection_method: Optional[str] = None
    notes: Optional[str] = None
    severity: Optional[str] = None


class ResultOut(BaseModel):
    id: int
    test_run_id: int
    output_text: Optional[str]
    vulnerability_detected: bool
    notes: Optional[str]
    severity: Optional[str]

    class Config:
        from_attributes = True


# --- Stats ---

class CategoryCount(BaseModel):
    category: str
    count: int

class RiskCount(BaseModel):
    risk_level: str
    count: int

class SeverityCount(BaseModel):
    severity: str
    count: int

class StatsOverview(BaseModel):
    total_scans: int
    completed: int
    pending: int
    total_results: int
    vulnerable: int
    safe: int
    detection_rate: float
    by_category: list[CategoryCount]
    by_risk: list[RiskCount]
    by_severity: list[SeverityCount]
    vuln_by_category: list[CategoryCount]


# --- LLM Interact ---

class LLMInteractRequest(BaseModel):
    prompt: str
    provider: str
    model: str
    api_key: str


class LLMInteractResponse(BaseModel):
    response: str
    provider: str
    model: str
