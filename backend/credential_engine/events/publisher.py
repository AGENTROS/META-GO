import asyncio
from core.events.event_bus import event_bus

class EventPublisher:
    """
    Legacy wrapper that proxies events to the new Global Event Bus.
    """
    @staticmethod
    def publish(event_type: str, payload: dict):
        coro = event_bus.publish(event_type, payload)
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(coro)
        except RuntimeError:
            asyncio.run(coro)
