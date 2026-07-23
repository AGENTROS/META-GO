import pytest
from httpx import AsyncClient, ASGITransport
from api_gateway.main import app


@pytest.mark.asyncio
async def test_register_face_api():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post("/api/v1/biometric/face/register")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True


@pytest.mark.asyncio
async def test_verify_face_api():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post("/api/v1/biometric/face/verify")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
