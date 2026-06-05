from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # 🌟 Fully Synced Branding Matrix
    PROJECT_NAME: str = "Nexus Metric Core"
    VERSION: str = "3.2.4"
    API_V1_STR: str = "/api/v1"
    
    # Modern Psycopg3 driver configuration 
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/nebula_db",
        validation_alias="DATABASE_URL"
    )
    
    # 🎛️ COGNITIVE LAYER TOGGLE MATRIX
    INFERENCE_MODE: str = Field(default="local", validation_alias="INFERENCE_MODE")
    LOCAL_LLM_URL: str = Field(default="http://127.0.0.1:8080/v1/chat/completions", validation_alias="LOCAL_LLM_URL")
    
    # Cloud Provider Configs
    CLOUD_PROVIDER: str = Field(default="groq", validation_alias="CLOUD_PROVIDER")
    CLOUD_API_KEY: str = Field(default="", validation_alias="GROQ_API_KEY")
    CLOUD_MODEL_NAME: str = Field(default="llama-3.3-70b-versatile", validation_alias="CLOUD_MODEL_NAME")
    
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()