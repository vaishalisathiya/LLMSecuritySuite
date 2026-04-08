from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from typing import List

# --- User ---

class UserOut(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


# --- Model + Access ---

class LoginInfo(BaseModel):
    location: str
    credential_reference: str


class LLMModelCreate(BaseModel):
    name: str
    provider: str
    model_type: str
    access_method: str
    access_url: Optional[str] = None #if browser based, where to look to enter data
    browser_textbox: Optional[str] = None
    credential_reference: Optional[str] = None,
    login_info: Optional[List[LoginInfo]] = []


class LLMModelOut(BaseModel):
    id: int
    name: str
    provider: str
    model_type: str
    access_method: str
    access_url: Optional[str] = None #if browser based, where to look to enter data
    browser_textbox: Optional[str] = None
    credential_reference: Optional[str] = None,
    login_info: Optional[List[LoginInfo]] = []

    class Config:
        from_attributes = True

# --- Prompt ---

class PromptCreate(BaseModel):
    input_text: str
    category: str
    risk_level: str
    created_by: int
    acceptance_criteria: str


class PromptOut(BaseModel):
    id: int
    input_text: str
    category: str
    risk_level: str
    created_by: Optional[int]
    acceptance_criteria: str

    class Config:
        from_attributes = True


# --- Test Run ---

class TestSuiteCreate(BaseModel):
    prompt_id_list: List[int]
    model_id: int


class TestSuiteOut(BaseModel):
    id: int
    prompt_id_list: List[int]
    model_id: int
    run_status: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- Result ---

class ResultCreate(BaseModel):
    prompt_id: int
    test_suite_id: int
    output_text: str
    vulnerability_detected: bool
    detection_method: Optional[str] = None
    notes: str
    severity: Optional[str] = None
    confidence: float
    acceptance_criteria: str

class ResultOut(BaseModel):
    id: int
    prompt_id: int
    test_suite_id: int
    output_text: str
    vulnerability_detected: bool
    notes: str
    severity: Optional[str]
    confidence: float
    acceptance_criteria: str

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
    model: str | None = None
    api_key: str
    endpoint: str | None = None


class LLMInteractResponse(BaseModel):
    response: str
    provider: str
    model: str
