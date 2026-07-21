from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from ..interfaces.graph_repo import GraphRepository
from ..models.graph_edge import GraphEdgeModel

class MongoGraphRepository(GraphRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db.get_collection("identity_graph")

    async def add_edge(self, edge: GraphEdgeModel) -> None:
        doc = edge.model_dump()
        doc["_id"] = doc.pop("id")
        await self._collection.insert_one(doc)

    async def get_edges_by_did(self, did: str, edge_type: str = None) -> List[GraphEdgeModel]:
        query = {"did": did}
        if edge_type:
            query["edge_type"] = edge_type
            
        cursor = self._collection.find(query)
        edges = await cursor.to_list(length=1000)
        
        for doc in edges:
            doc["id"] = doc.pop("_id")
            
        return [GraphEdgeModel(**doc) for doc in edges]
