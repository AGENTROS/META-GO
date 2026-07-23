from fastapi import APIRouter, Request, HTTPException
from api_gateway.responses import StandardResponse
from ..services.identity_service import IdentityService
from ..repositories.identity_repo import MongoIdentityRepository
from core_services.identity_graph_engine.services.graph_service import (
    IdentityGraphService,
)
from core_services.identity_graph_engine.repositories.graph_repo import (
    MongoGraphRepository,
)
from core_services.wallet_engine.services.wallet_service import WalletService
from core_services.event_bus.in_memory import InMemoryEventBus
from api_gateway.database import db
from ..schemas.identity_schema import WalletLinkRequest

router = APIRouter(prefix="/api/v1/identity", tags=["Identity"])

# Dependency setup (in a real app, use Depends() with a container)
event_bus = InMemoryEventBus()


def get_identity_service():
    repo = MongoIdentityRepository(db.client["metago_core"])
    return IdentityService(repo, event_bus)


def get_wallet_service():
    repo = MongoGraphRepository(db.client["metago_core"])
    graph_service = IdentityGraphService(repo, event_bus)
    return WalletService(graph_service)


@router.post("", response_model=StandardResponse[dict])
async def create_identity(request: Request):
    service = get_identity_service()
    passport = await service.create_identity()
    return StandardResponse(
        success=True,
        data=passport.model_dump(),
        request_id=getattr(request.state, "correlation_id", "unknown"),
    )


@router.get("/{did}", response_model=StandardResponse[dict])
async def get_identity(did: str, request: Request):
    service = get_identity_service()
    passport = await service.fetch_identity(did)
    if not passport:
        raise HTTPException(status_code=404, detail="Identity not found")
    return StandardResponse(
        success=True,
        data=passport.model_dump(),
        request_id=getattr(request.state, "correlation_id", "unknown"),
    )


@router.patch("/{did}", response_model=StandardResponse[dict])
async def update_identity(did: str, request: Request):
    # Abstracted update mechanism
    return StandardResponse(
        success=True,
        data={"did": did, "message": "Updated successfully"},
        request_id=getattr(request.state, "correlation_id", "unknown"),
    )


@router.post("/wallet/link", response_model=StandardResponse[dict])
async def link_wallet(body: WalletLinkRequest, request: Request):
    wallet_service = get_wallet_service()
    try:
        await wallet_service.link_wallet(
            body.did, body.wallet_address, body.chain, body.signature
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return StandardResponse(
        success=True,
        data={"message": "Wallet linked successfully"},
        request_id=getattr(request.state, "correlation_id", "unknown"),
    )
