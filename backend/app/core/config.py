from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "ColdChain-RL Spoilage Prevention"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "coldchain-super-secret-ci-rl-key-2026-academic-research-lab"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./coldchain.db")
    
    DEFAULT_ALPHA: float = 0.1
    DEFAULT_GAMMA: float = 0.95
    DEFAULT_EPSILON: float = 0.15
    DEFAULT_EPSILON_MIN: float = 0.01
    DEFAULT_EPSILON_DECAY: float = 0.995

settings = Settings()
