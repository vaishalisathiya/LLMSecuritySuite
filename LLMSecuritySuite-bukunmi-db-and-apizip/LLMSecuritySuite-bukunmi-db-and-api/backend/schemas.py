from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserOut(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class ModelCreate(BaseModel):
    name: str
    provider: str
    model_type: str
    access_method: str
    credential_reference: Optional[str] = None


class ModelOut(BaseModel):
    id: int
    name: str
    provider: str
    model_type: str
    access_method: str
    credential_reference: Optional[str]

    class Config:
        from_attributes = True


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


class ResultCreate(BaseModel):
    output_text: Optional[str] = None
    vulnerability_detected: bool
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
