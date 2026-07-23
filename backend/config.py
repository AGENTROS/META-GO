"""Centralized configuration and startup validation for MetaGo backend.
Provides typed access to environment variables and enforces safety rules
for production and staging environments.
"""

import os
from dotenv import load_dotenv
from typing import Optional

base_dir = os.path.dirname(os.path.abspath(__file__))
# Load .env files local to backend (non-destructive)
load_dotenv(os.path.join(base_dir, ".env"))
load_dotenv(os.path.join(base_dir, "..", ".env"))


def _parse_bool(val: Optional[str]) -> bool:
    if val is None:
        return False
    v = val.strip().lower()
    return v in ("1", "true", "yes", "on")


class Config:
    def __init__(self):
        self.ENV = os.environ.get("ENV", "development").strip().lower()
        if self.ENV not in ("development", "staging", "production"):
            raise RuntimeError(f"Invalid ENV value: {self.ENV}")

        # TEST_MODE must be explicitly enabled. Default: False
        self.TEST_MODE = _parse_bool(os.environ.get("TEST_MODE"))

        # Core endpoints
        self.MONGO_URL = os.environ.get("MONGO_URL")
        self.DB_NAME = os.environ.get("DB_NAME", "metago_db")
        self.REDIS_URL = os.environ.get("REDIS_URL") or os.environ.get("REDIS")

        # Secrets
        self.JWT_SECRET = os.environ.get("JWT_SECRET")
        self.VOICE_TEMPLATE_KEY = os.environ.get("VOICE_TEMPLATE_KEY")

        # Optional feature toggles
        self.AUTO_MIGRATE_VOICE_TEMPLATES = _parse_bool(
            os.environ.get("AUTO_MIGRATE_VOICE_TEMPLATES")
        )

    def is_production(self) -> bool:
        return self.ENV == "production"

    def validate_startup(self):
        # TEST_MODE safety
        if self.is_production() and self.TEST_MODE:
            raise RuntimeError(
                "MetaGo startup blocked: TEST_MODE cannot be enabled in production."
            )

        # Mandatory secrets in non-test contexts
        if not self.JWT_SECRET:
            if not (self.TEST_MODE and not self.is_production()):
                raise RuntimeError(
                    "CRITICAL CONFIGURATION ERROR: JWT_SECRET environment variable is not set."
                )

        # Mongo required in production
        if self.is_production() and not self.MONGO_URL:
            raise RuntimeError(
                "CRITICAL CONFIGURATION ERROR: MONGO_URL must be set in production."
            )

        # Redis recommended in production; presence enforced in readiness checks elsewhere

    def require_voice_key_for_production(self):
        if self.is_production() and not self.VOICE_TEMPLATE_KEY:
            raise RuntimeError(
                "CRITICAL CONFIGURATION ERROR: VOICE_TEMPLATE_KEY must be set in production."
            )


cfg = Config()
