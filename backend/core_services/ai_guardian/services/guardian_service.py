from typing import Optional, List
from .context_engine import ContextEngine
from .reasoning_engine import ReasoningEngine
from ..models.recommendation import GuardianRecommendationModel

class GuardianService:
    def __init__(self, context_engine: ContextEngine, reasoning_engine: ReasoningEngine):
        self.context_engine = context_engine
        self.reasoning_engine = reasoning_engine
        # Short-lived contextual memory (in-memory mock for now)
        self._memory = {}

    async def process_event(self, did: str, event_data: dict) -> Optional[GuardianRecommendationModel]:
        """Event Driven processing. Gets context, reasons, and stores recommendation in memory."""
        context = await self.context_engine.build_context(did, trigger_event=event_data)
        rec = await self.reasoning_engine.generate_recommendation(did, context)
        
        if rec:
            if did not in self._memory:
                self._memory[did] = []
            self._memory[did].append(rec)
            
        return rec

    async def get_recommendations(self, did: str) -> List[GuardianRecommendationModel]:
        """Fetch short-lived memory recommendations."""
        return self._memory.get(did, [])
