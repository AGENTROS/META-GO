import pytest
from platform_connectors.manager import connector_manager
from platform_connectors.transport.base import BaseTransport
from platform_connectors.unity.connector import UnityConnector

# Register for tests
connector_manager.register("unity", UnityConnector)

# A dummy transport just for testing
class MockTransport(BaseTransport):
    def __init__(self):
        self.sent_payloads = []
        self._closed = False
        
    async def send(self, payload: dict):
        self.sent_payloads.append(payload)
        
    async def receive(self) -> dict:
        pass
        
    async def close(self):
        self._closed = True

@pytest.mark.asyncio
async def test_unity_connector_contract():
    """
    Contract Test: Ensure the Unity reference connector honors the 
    strict PlatformConnector lifecycle API without throwing errors.
    """
    session_id = "test_contract_session"
    transport = MockTransport()
    
    # establish_session() inherently executes: initialize(), connect(), and subscribe_events()
    connector = await connector_manager.establish_session(session_id, "unity", transport)
    
    assert connector is not None
    assert session_id in connector_manager._active_sessions
    
    # Test authentication rejection
    auth_success = await connector.authenticate({"token": "bad_token"})
    assert not auth_success
    
    # Test authentication success
    auth_success = await connector.authenticate({"token": "mock_valid_token"})
    assert auth_success
    
    # Sync presence should not throw errors
    await connector.sync_presence({"position": [0,0,0]})
    
    # Teardown inherently executes: disconnect() and shutdown()
    await connector_manager.terminate_session(session_id)
    
    assert session_id not in connector_manager._active_sessions
    assert transport._closed is True
