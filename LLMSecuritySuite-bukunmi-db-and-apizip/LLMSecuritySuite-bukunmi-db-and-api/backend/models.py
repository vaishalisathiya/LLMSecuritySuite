from sqlalchemy import Boolean, Column, ForeignKey, Integer, Text, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    email = Column(Text, unique=True, nullable=False)

    prompts = relationship("Prompt", back_populates="creator")


class Model(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    provider = Column(Text, nullable=False)
    model_type = Column(Text, nullable=False)
    access_method = Column(Text, nullable=False)
    credential_reference = Column(Text)

    test_runs = relationship("TestRun", back_populates="model")


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True)
    input_text = Column(Text, nullable=False)
    category = Column(Text, nullable=False)
    risk_level = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))

    creator = relationship("User", back_populates="prompts")
    test_runs = relationship("TestRun", back_populates="prompt")


class TestRun(Base):
    __tablename__ = "test_runs"

    id = Column(Integer, primary_key=True)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=False)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    run_status = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    prompt = relationship("Prompt", back_populates="test_runs")
    model = relationship("Model", back_populates="test_runs")
    results = relationship("Result", back_populates="test_run")


class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True)
    test_run_id = Column(Integer, ForeignKey("test_runs.id"), nullable=False)
    output_text = Column(Text)
    vulnerability_detected = Column(Boolean, nullable=False)
    notes = Column(Text)
    severity = Column(Text)

    test_run = relationship("TestRun", back_populates="results")
