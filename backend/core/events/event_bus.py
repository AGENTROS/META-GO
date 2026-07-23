from core.events.event import MetaGoEvent
from core.events.dispatcher import EventDispatcher
from core.events.subscriber import EventCallback


class GlobalEventBus:
    """
    The central nervous system for MetaGo infrastructure.
    Singleton instance that routes all internal domain events to subscribed connectors/engines.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GlobalEventBus, cls).__new__(cls)
            cls._instance.dispatcher = EventDispatcher()
        return cls._instance

    @classmethod
    def publish(cls, event_type: str, payload: dict):
        """
        Publishes an event to the global bus.
        Note: This is async-friendly but meant to be called from async contexts.
        """
        event = MetaGoEvent(event=event_type, payload=payload)
        return cls().dispatcher.dispatch(event)

    @classmethod
    def subscribe(cls, event_type: str, callback: EventCallback):
        cls().dispatcher.subscribe(event_type, callback)

    @classmethod
    def unsubscribe(cls, event_type: str, callback: EventCallback):
        cls().dispatcher.unsubscribe(event_type, callback)


# Expose a default instance for easy imports
event_bus = GlobalEventBus()
