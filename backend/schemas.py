from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
from typing import List

# --- Tenant ---

class TenantCreate(BaseModel):
    name: str

class TenantOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


# --- User ---

class UserCreate(BaseModel):
    name: str
    email: str
    role: str = "viewer"

class UserOut(BaseModel):
    id: int
    tenant_id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


# --- Signup ---

class SignupRequest(BaseModel):
    name: str
    email: str
    role: str = "viewer"
    # Provide either tenant_id (join existing) or tenant_name (create new)
    tenant_id: Optional[int] = None
    tenant_name: Optional[str] = None

class SignupOut(BaseModel):
    user_id: int
    tenant_id: int
    name: str
    email: str
    role: str


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
    credential_reference: Optional[str] = None
    login_info: Optional[List[LoginInfo]] = []

class LLMModelOut(BaseModel):
    id: int
    name: str
    provider: str
    model_type: str
    access_method: str
    access_url: Optional[str] = None #if browser based, where to look to enter data
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

class LLMModel(BaseModel):
    name: str
    provider: str
    model_type: str
    access_method: str
    acceptance_criteria: str
    access_url: Optional[str] = None
    browser_textbox: Optional[str] = None
    credential_reference: Optional[str] = None
    login_info: Optional[List[LoginInfo]] = []

class LLMPromptRequest(BaseModel):
    prompt: LLMPrompt
    model: LLMModel
    
class LLMInteractRequest(BaseModel):
    prompt_list: List[LLMPrompt]
    model: LLMModel

class LLMPromptResponse(BaseModel):
    response: str
    provider: str
    model: str
