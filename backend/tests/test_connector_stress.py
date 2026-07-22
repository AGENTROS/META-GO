import pytest
import asyncio
import uuid
from core.events.event_bus import event_bus
from platform_connectors.manager import connector_manager
from platform_connectors.transport.base import BaseTransport
from platform_connectors.unity.connector import UnityConnector

# Register for tests
connector_manager.register("unity", UnityConnector)

class StressTransport(BaseTransport):
    def __init__(self):
        self.msg_count = 0
        
    async def send(self, payload: dict):
        self.msg_count += 1
        
    async def receive(self) -> dict:
        await asyncio.sleep(1) # Prevent infinite block in dummy loop
        return {}
        
    async def close(self):
        pass

@pytest.mark.asyncio
async def test_event_bus_100_session_stress():
    """
    Stress Test: Simulates 100 simultaneous Unity clients connecting, authenticating, 
    and receiving a massive rapid flood of Presence events to verify the core infrastructure
    does not leak memory or drop async tasks.
    """
    sessions = []
    
    # 1. Establish 100 simultaneous connections
    for _ in range(100):
        session_id = str(uuid.uuid4())
        transport = StressTransport()
        connector = await connector_manager.establish_session(session_id, "unity", transport)
        import jwt
        from config import cfg
        valid_token = jwt.encode({"walletAddress": "0x123"}, cfg.JWT_SECRET or "metago_secure_default_test_jwt_secret_key_32_bytes_long_2026", algorithm="HS256")
        await connector.authenticate({"token": valid_token})
        sessions.append((session_id, transport))
        
    assert len(connector_manager._active_sessions) == 100
    
    # 2. Rapid flood of Presence events (simulate massive multiplayer movement)
    flood_tasks = []
    for i in range(50):
        # Fire 50 simultaneous events to the global bus
        flood_tasks.append(
            event_bus.publish("Presence.Active", {"user_id": i, "position": [1,2,3]})
        )
    await asyncio.gather(*flood_tasks)
    
    # 3. Yield to the event loop so dispatcher callbacks execute
    await asyncio.sleep(0.5)
    
    # 4. Verify message delivery
    for session_id, transport in sessions:
        # 1 Auth.Success message + 50 Presence events = 51 messages
        assert transport.msg_count == 51
        
    # 5. Teardown 100 sessions
    for session_id, _ in sessions:
        await connector_manager.terminate_session(session_id)
        
    assert len(connector_manager._active_sessions) == 0
    # Also verify that the event_bus subscribers are purged
    # We expect 0 subscribers for Presence.Active after shutdown
    assert len(event_bus.dispatcher._subscribers.get("Presence.Active", set())) == 0
