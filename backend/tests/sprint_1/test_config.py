import pytest
from core_services.config import get_settings


def test_settings_load():
    settings = get_settings()
    assert settings.PROJECT_NAME == "MetaGo Universal Identity Protocol"
    assert settings.ENVIRONMENT in ["dev", "test", "prod"]
    assert settings.MONGO_URI is not None
    assert settings.JWT_SECRET is not None
