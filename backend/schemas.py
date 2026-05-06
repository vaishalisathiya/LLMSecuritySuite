from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
from typing import List

# --- User ---

class UserOut(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class RegisterIn(BaseModel):
    name: str
    username: str
    email: str
    password: str


class LoginIn(BaseModel):
    username: str
    password: str


class AuthOut(BaseModel):
    id: int
    name: str
    username: Optional[str]
    email: str
    role: str

    class Config:
        from_attributes = True


# --- Model + Access ---

class LoginInfo(BaseModel):
    location: str
    action: str  # input, click
    credential_reference: Optional[str] = None
    follow_up: Optional[str] = None  # enter, click, etc.

class LLMModelCreate(BaseModel):
    name: str
    provider: str
    model_type: str
    access_method: str
    model_identifier: str
    access_url: Optional[str] = None
    browser_textbox: Optional[str] = None
    credential_reference: Optional[str] = None
    login_info: Optional[List[LoginInfo]] = []

class LLMModelOut(BaseModel):
    id: int
    name: str
    provider: str
    model_type: str
    access_method: str
    model_identifier: str
    access_url: Optional[str] = None
    browser_textbox: Optional[str] = None
    credential_reference: Optional[str] = None
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
    acceptance_criteria: Optional[str] = None

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
    prompt_id: Optional[int] = None
    output_text: Optional[str] = None
    vulnerability_detected: bool
    detection_method: Optional[str] = None
    notes: Optional[str] = None
    severity: Optional[str] = None
    confidence: Optional[float] = None
    acceptance_criteria: Optional[str] = None

class ResultOut(BaseModel):
    id: int
    test_run_id: int
    prompt_id: Optional[int] = None
    output_text: Optional[str] = None
    vulnerability_detected: bool
    notes: Optional[str] = None
    severity: Optional[str] = None
    confidence: Optional[float] = None
    acceptance_criteria: Optional[str] = None

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

class LLMPrompt(BaseModel):
    input_text: str
    category: str
    risk_level: str
    created_by: int
    acceptance_criteria: str
    prompt_id: Optional[int] = None

class LLMModel(BaseModel):
    name: str
    provider: str
    model_type: str
    access_method: str
    access_url: Optional[str] = None
    browser_textbox: Optional[str] = None
    credential_reference: Optional[str] = None
    login_info: Optional[List[LoginInfo]] = []

class LLMPromptRequest(BaseModel):
    prompt: LLMPrompt
    model: LLMModel
    scan_id: Optional[int] = None

class LLMPromptResponse(BaseModel):
    response: str
    provider: str
    model: str

class LLMInteractRequest(BaseModel):
    prompt_list: List[LLMPrompt]
    model: LLMModel
    scan_id: Optional[int] = None