import asyncio
import logging
from typing import Dict, List, Set
from core.events.event import MetaGoEvent
from core.events.subscriber import EventCallback

logger = logging.getLogger("metago.events.dispatcher")


class EventDispatcher:
    """
    Handles the routing of events to their subscribed callbacks.
    """

    def __init__(self):
        # Maps event_type -> set of callbacks
        self._subscribers: Dict[str, Set[EventCallback]] = {}

    def subscribe(self, event_type: str, callback: EventCallback):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = set()
        self._subscribers[event_type].add(callback)
        logger.debug(f"Subscribed to {event_type}")

    def unsubscribe(self, event_type: str, callback: EventCallback):
        if event_type in self._subscribers:
            self._subscribers[event_type].discard(callback)

    async def dispatch(self, event: MetaGoEvent):
        callbacks = self._subscribers.get(event.event, set())

        # Also dispatch to wildcard subscribers if any (e.g. '*')
        wildcard_callbacks = self._subscribers.get("*", set())

        all_callbacks = callbacks.union(wildcard_callbacks)

        if not all_callbacks:
            logger.debug(f"No subscribers for event: {event.event}")
            return

        # Fire all callbacks concurrently
        tasks = [
            asyncio.create_task(self._safe_execute(cb, event)) for cb in all_callbacks
        ]
        await asyncio.gather(*tasks)

    async def _safe_execute(self, callback: EventCallback, event: MetaGoEvent):
        try:
            await callback(event)
        except Exception as e:
            logger.error(
                f"Error in event handler for {event.event}: {str(e)}", exc_info=True
            )
