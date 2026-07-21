from fastapi import APIRouter, Request, HTTPException
from api_gateway.responses import StandardResponse

router = APIRouter(prefix="/api/v1/biometric", tags=["Biometrics"])

@router.post("/face/register", response_model=StandardResponse[dict])
async def register_face(request: Request):
    # Abstract route - implementation details hidden
    return StandardResponse(
        success=True,
        data={"message": "Face registration initiated"},
        request_id=getattr(request.state, "correlation_id", "unknown")
    )

@router.post("/face/verify", response_model=StandardResponse[dict])
async def verify_face(request: Request):
    return StandardResponse(
        success=True,
        data={"message": "Face verified successfully"},
        request_id=getattr(request.state, "correlation_id", "unknown")
    )
