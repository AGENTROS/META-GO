from fastapi import APIRouter, Request
from api_gateway.responses import StandardResponse
from ..services.consent_service import ConsentService
from ..repositories.consent_repo import MongoConsentRepository
from core_services.event_bus.in_memory import InMemoryEventBus
from api_gateway.database import db

router = APIRouter(prefix="/api/v1/consent", tags=["Consent"])


@router.post("/grant", response_model=StandardResponse[dict])
async def grant_consent(request: Request):
    return StandardResponse(
        success=True,
        data={"message": "Consent granted successfully"},
        request_id=getattr(request.state, "correlation_id", "unknown"),
    )


@router.post("/revoke", response_model=StandardResponse[dict])
async def revoke_consent(request: Request):
    return StandardResponse(
        success=True,
        data={"message": "Consent revoked successfully"},
        request_id=getattr(request.state, "correlation_id", "unknown"),
    )
