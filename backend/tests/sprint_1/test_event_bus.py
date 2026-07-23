import pytest
import asyncio
from core_services.event_bus.in_memory import InMemoryEventBus


@pytest.mark.asyncio
async def test_event_bus_pub_sub():
    bus = InMemoryEventBus()
    received_payload = {}

    async def sample_handler(payload: dict):
        received_payload.update(payload)

    await bus.subscribe("Test.Event", sample_handler)
    await bus.publish("Test.Event", {"data": "hello world"})

    # Allow async task to complete
    await asyncio.sleep(0.01)

    assert received_payload.get("data") == "hello world"
