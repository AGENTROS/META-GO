from abc import ABC, abstractmethod
from typing import List
from ..models.graph_edge import GraphEdgeModel

class GraphRepository(ABC):
    @abstractmethod
    async def add_edge(self, edge: GraphEdgeModel) -> None:
        pass

    @abstractmethod
    async def get_edges_by_did(self, did: str, edge_type: str = None) -> List[GraphEdgeModel]:
        pass
