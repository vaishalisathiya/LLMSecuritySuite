from sqlalchemy import Boolean, Column, ForeignKey, Integer, Text, DateTime, Float, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name = Column(Text, nullable=False)
    email = Column(Text, unique=True, nullable=False)
    role = Column(Text, nullable=False, default="viewer")

    prompts = relationship("Prompt", back_populates="creator")


class LLMModel(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name = Column(Text, nullable=False)
    provider = Column(Text, nullable=False)
    model_type = Column(Text, nullable=False)
    interface_type = Column(Text, nullable=False)
    access_method = Column(Text, nullable=False)
    model_identifier = Column(Text, nullable=False)
    credential_reference = Column(Text, nullable=True)
    access_url = Column(Text, nullable=True)
    browser_textbox = Column(Text, nullable=True)
    login_info = Column(JSON, nullable=True)

    test_suites = relationship("TestSuite", back_populates="model")


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    input_text = Column(Text, nullable=False)
    category = Column(Text, nullable=False)
    risk_level = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    acceptance_criteria = Column(Text, nullable=True)

    creator = relationship("User", back_populates="prompts")


class TestSuite(Base):
    __tablename__ = "test_runs"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    prompt_id_list = Column(JSON, nullable=False)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    run_status = Column(Text, nullable=False, default="pending")
    celery_task_id = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)

    model = relationship("LLMModel", back_populates="test_suites")
    results = relationship("Result", back_populates="test_suite")
    logs = relationship("Log", back_populates="test_suite")


class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True)
    test_run_id = Column(Integer, ForeignKey("test_runs.id"), nullable=False)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=True)
    output_text = Column(Text)
    vulnerability_detected = Column(Boolean, nullable=False)
    detection_method = Column(Text, nullable=True)
    notes = Column(Text)
    severity = Column(Text)
    confidence = Column(Float, nullable=True)
    acceptance_criteria = Column(Text, nullable=True)

    test_suite = relationship("TestSuite", back_populates="results")


class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True)
    test_run_id = Column(Integer, ForeignKey("test_runs.id"), nullable=True)
    level = Column(Text, nullable=False)
    message = Column(Text, nullable=False)
    stack_trace = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    test_suite = relationship("TestSuite", back_populates="logs")
