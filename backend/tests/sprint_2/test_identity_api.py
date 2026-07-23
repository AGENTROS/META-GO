import pytest
from httpx import AsyncClient, ASGITransport
from api_gateway.main import app
from unittest.mock import patch, AsyncMock, MagicMock


@pytest.mark.asyncio
@patch("core_services.identity_engine.api.router.get_identity_service")
async def test_create_identity_api(mock_get_service):
    mock_service = AsyncMock()
    mock_passport = MagicMock()
    mock_passport.model_dump.return_value = {
        "did": "did:metago:1234",
        "user_id": "u-1234",
        "verification_status": "unverified",
        "wallet_links": [],
        "avatar_reference": None,
        "humanity_status": "pending",
        "created_at": "2026-07-19T00:00:00",
        "updated_at": "2026-07-19T00:00:00",
    }
    mock_service.create_identity.return_value = mock_passport
    mock_get_service.return_value = mock_service

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post("/api/v1/identity")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["did"] == "did:metago:1234"


@pytest.mark.asyncio
@patch("core_services.identity_engine.api.router.get_wallet_service")
async def test_link_wallet_api(mock_get_service):
    mock_service = AsyncMock()
    mock_service.link_wallet.return_value = True
    mock_get_service.return_value = mock_service

    payload = {
        "did": "did:metago:1234",
        "wallet_address": "0x1234567890abcdef1234567890abcdef12345678",
    }

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post("/api/v1/identity/wallet/link", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["message"] == "Wallet linked successfully"
