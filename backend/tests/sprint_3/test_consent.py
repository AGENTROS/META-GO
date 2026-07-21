import pytest
from httpx import AsyncClient, ASGITransport
from api_gateway.main import app
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_grant_consent_api():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/consent/grant")
        
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "message" in data["data"]

@pytest.mark.asyncio
async def test_revoke_consent_api():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/consent/revoke")
        
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
