from fastapi import APIRouter, Request
from core_services.config import get_settings
from api_gateway.database import db
from api_gateway.responses import StandardResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=StandardResponse[dict])
async def check_health(request: Request):
    """Deep health check ensuring database connectivity."""
    db_status = "ok"
    try:
        await db.client.admin.command("ping")
    except Exception:
        db_status = "error"

    req_id = getattr(request.state, "correlation_id", "unknown")
    return StandardResponse(
        success=db_status == "ok", data={"database": db_status}, request_id=req_id
    )


@router.get("/ready", response_model=StandardResponse[dict])
async def check_ready(request: Request):
    """Check if the service is ready to accept traffic."""
    req_id = getattr(request.state, "correlation_id", "unknown")
    return StandardResponse(success=True, data={"status": "ready"}, request_id=req_id)


@router.get("/version", response_model=StandardResponse[dict])
async def get_version(request: Request):
    """Return current API version and environment."""
    settings = get_settings()
    req_id = getattr(request.state, "correlation_id", "unknown")
    return StandardResponse(
        success=True,
        data={"version": settings.VERSION, "environment": settings.ENVIRONMENT},
        request_id=req_id,
    )
