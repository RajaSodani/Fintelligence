from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""
    CLERK_PEM_PUBLIC_KEY: str = ""
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3001"]
    PORT: int = 3002

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
