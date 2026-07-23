import pytest
from httpx import AsyncClient, ASGITransport
from api_gateway.main import app


@pytest.mark.asyncio
async def test_guardian_analyze():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post("/api/v1/guardian/analyze")
    assert response.status_code == 200
    assert response.json()["success"] is True


@pytest.mark.asyncio
async def test_guardian_recommendations():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.get("/api/v1/guardian/recommendations/did:metago:123")
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "recommendations" in response.json()["data"]


@pytest.mark.asyncio
async def test_guardian_explanations():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.get("/api/v1/guardian/explanations/rec-123")
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "explanation" in response.json()["data"]
