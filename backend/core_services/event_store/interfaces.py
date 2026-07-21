from abc import ABC, abstractmethod
from .models.event import EventModel
from typing import List

class EventStoreRepository(ABC):
    @abstractmethod
    async def save_event(self, event: EventModel) -> None:
        """Save a new event to the store."""
        pass

    @abstractmethod
    async def get_events_by_correlation_id(self, correlation_id: str) -> List[EventModel]:
        """Fetch all events linked to a correlation ID."""
        pass
