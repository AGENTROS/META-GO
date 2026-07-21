from fastapi import APIRouter, Request, HTTPException
from api_gateway.responses import StandardResponse
from pydantic import BaseModel

class CreateAvatarRequest(BaseModel):
    did: str
    provider: str
    params: dict

class ImportAvatarRequest(BaseModel):
    did: str
    provider: str
    asset_url: str
    metadata: dict

router = APIRouter(prefix="/api/v1/avatar", tags=["Avatar"])

@router.post("/create", response_model=StandardResponse[dict])
async def create_avatar(body: CreateAvatarRequest, request: Request):
    # In a real app we'd inject AvatarManager from the app state
    return StandardResponse(
        success=True,
        data={"message": "Avatar creation initiated for " + body.provider},
        request_id=getattr(request.state, "correlation_id", "unknown")
    )

@router.post("/import", response_model=StandardResponse[dict])
async def import_avatar(body: ImportAvatarRequest, request: Request):
    return StandardResponse(
        success=True,
        data={"message": "Avatar import initiated from " + body.asset_url},
        request_id=getattr(request.state, "correlation_id", "unknown")
    )

@router.get("/providers", response_model=StandardResponse[list])
async def list_providers(request: Request):
    return StandardResponse(
        success=True,
        data=["ready_player_me", "vrm", "custom_glb"],
        request_id=getattr(request.state, "correlation_id", "unknown")
    )

@router.get("/{avatar_id}", response_model=StandardResponse[dict])
async def get_avatar(avatar_id: str, request: Request):
    return StandardResponse(
        success=True,
        data={"avatar_id": avatar_id, "status": "active"},
        request_id=getattr(request.state, "correlation_id", "unknown")
    )

@router.delete("/{avatar_id}", response_model=StandardResponse[dict])
async def delete_avatar(avatar_id: str, request: Request):
    return StandardResponse(
        success=True,
        data={"message": "Avatar deleted"},
        request_id=getattr(request.state, "correlation_id", "unknown")
    )


