from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""
    CLERK_PEM_PUBLIC_KEY: str = ""
    JWT_SECRET: str = "dev-secret-change-in-prod"
    FRONTEND_URL: str = ""
    PORT: int = 3002

    @property
    def allowed_origins(self) -> List[str]:
        origins = ["http://localhost:5173", "http://localhost:3001"]
        if self.FRONTEND_URL:
            origins.append(self.FRONTEND_URL)
        return origins

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
