from pydantic import BaseModel
from typing import List

class PROMPT(BaseModel):
    id: int
    prompt: str
    acceptance_criteria: List[str]

class LOGIN_INFO(BaseModel):
    location: str
    input: str

class LLM_INFO(BaseModel):
    id: int
    name: str
    type: int  #0 = API, 1 = Browser
    api_key: str
    login_details: List[LOGIN_INFO]

class LLM_TEST_REQUEST(BaseModel):
    prompts: List[PROMPT] 
    llm_info: LLM_INFO