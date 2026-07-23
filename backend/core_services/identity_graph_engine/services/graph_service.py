import uuid
from typing import List
from ..models.graph_edge import GraphEdgeModel
from ..interfaces.graph_repo import GraphRepository
from core_services.event_bus.interfaces import EventBus


class IdentityGraphService:
    def __init__(self, repo: GraphRepository, event_bus: EventBus):
        self.repo = repo
        self.event_bus = event_bus

    async def link_wallet(
        self, did: str, wallet_address: str, chain: str = "ethereum"
    ) -> GraphEdgeModel:
        edge = GraphEdgeModel(
            id=str(uuid.uuid4()),
            did=did,
            edge_type="wallet",
            target_id=wallet_address,
            metadata={"chain": chain},
        )
        await self.repo.add_edge(edge)

        await self.event_bus.publish(
            "Graph.WalletLinked",
            {
                "version": "v1",
                "did": did,
                "wallet_address": wallet_address,
                "chain": chain,
            },
        )
        return edge

    async def get_links(self, did: str, edge_type: str = None) -> List[GraphEdgeModel]:
        return await self.repo.get_edges_by_did(did, edge_type)
