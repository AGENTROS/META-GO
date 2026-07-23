import pytest
from httpx import AsyncClient, ASGITransport
from api_gateway.main import app

from unittest.mock import patch, AsyncMock, MagicMock


@pytest.mark.asyncio
@patch("api_gateway.routes.health.db")
async def test_health_endpoint(mock_db):
    # Setup mock chain: db.client.admin.command
    mock_admin = AsyncMock()
    mock_admin.command.return_value = {"ok": 1}
    mock_client = MagicMock()
    mock_client.admin = mock_admin
    mock_db.client = mock_client

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "database" in data["data"]
    assert "request_id" in data


@pytest.mark.asyncio
async def test_ready_endpoint():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "ready"


@pytest.mark.asyncio
async def test_version_endpoint():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.get("/version")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "version" in data["data"]
