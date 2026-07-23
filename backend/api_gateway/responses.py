from pydantic import BaseModel
from typing import Generic, TypeVar, Optional, Any
from fastapi import Request
from fastapi.responses import JSONResponse

T = TypeVar("T")


class StandardResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    meta: Optional[dict] = None
    request_id: str


async def global_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "correlation_id", "unknown")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc),
                "request_id": req_id,
            },
        },
    )
