import pytest
from httpx import AsyncClient, ASGITransport
from api_gateway.main import app
from core_services.avatar_engine.services.validator import AvatarValidator
from core_services.avatar_engine.providers.ready_player_me import ReadyPlayerMeProvider

def test_avatar_validator():
    # Valid asset
    assert AvatarValidator.validate_asset("https://example.com/model.glb", {"size_mb": 10, "skeleton_type": "humanoid"}) is True
    
    # Invalid extension
    with pytest.raises(ValueError, match="Invalid file type"):
        AvatarValidator.validate_asset("https://example.com/model.obj", {"size_mb": 10, "skeleton_type": "humanoid"})
        
    # Invalid skeleton
    with pytest.raises(ValueError, match="humanoid"):
        AvatarValidator.validate_asset("https://example.com/model.glb", {"size_mb": 10, "skeleton_type": "quadruped"})

@pytest.mark.asyncio
async def test_ready_player_me_provider():
    provider = ReadyPlayerMeProvider()
    assert provider.provider_name == "ready_player_me"
    
    avatar = await provider.create_avatar({})
    assert "provider_avatar_id" in avatar
    assert avatar["skeleton_type"] == "humanoid"

@pytest.mark.asyncio
async def test_avatar_apis():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res1 = await ac.get("/api/v1/avatar/providers")
        assert res1.status_code == 200
        assert "ready_player_me" in res1.json()["data"]
        
        payload = {
            "did": "did:metago:123",
            "provider": "ready_player_me",
            "params": {}
        }
        res2 = await ac.post("/api/v1/avatar/create", json=payload)
        assert res2.status_code == 200
        assert res2.json()["success"] is True
