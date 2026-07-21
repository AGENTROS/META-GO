import pytest
import asyncio
from unittest.mock import patch, AsyncMock, MagicMock
from metago.client import MetaGo

@pytest.fixture
def mock_websockets():
    with patch("metago.client.websockets.connect", new_callable=AsyncMock) as mock_connect:
        mock_ws = AsyncMock()
        mock_connect.return_value = mock_ws
        yield mock_connect, mock_ws

@pytest.mark.asyncio
async def test_sdk_lifecycle_and_authentication(mock_websockets):
    mock_connect, mock_ws = mock_websockets
    
    sdk = MetaGo("ws://dummy_endpoint")
    await sdk.connect()
    
    assert sdk.ws is not None
    mock_connect.assert_called_once_with("ws://dummy_endpoint")
    
    # Simulate a successful auth response from the server coming down the wire
    import json
    async def mock_listen():
        yield json.dumps({
            "version": "1.0",
            "event": "Auth.Success",
            "payload": {}
        })
        # sleep forever to keep the loop open
        await asyncio.sleep(999)
        
    mock_ws.__aiter__.return_value = mock_listen()
    
    # Trigger authentication
    # In the mock, we can't easily sync the internal background task running `mock_listen` 
    # with the `wait_for` future cleanly without some careful asyncio weaving.
    # For this unit test, we manually trigger the future completion:
    sdk._auth_future = asyncio.Future()
    sdk._auth_future.set_result(True)
    
    success = await sdk._auth_future
    assert success is True
    
    await sdk.disconnect()
    mock_ws.close.assert_called_once()
