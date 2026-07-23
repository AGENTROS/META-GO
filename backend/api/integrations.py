from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

integrations_router = APIRouter(prefix="/api/integrations", tags=["Integrations"])

# Mock DB for connected integrations
MOCK_USER_INTEGRATIONS = {
    "ethereum": True,
    "polygon": True,
    "arbitrum": True,
    "base": True,
    # Others like 'opensea', 'decentraland', 'uniswap', etc. are implicitly false
}


@integrations_router.get("/status")
async def get_integration_status():
    """Returns the current connected integrations."""
    return {"status": "success", "data": MOCK_USER_INTEGRATIONS}


@integrations_router.get("/connect/{provider}")
async def connect_integration(provider: str, request: Request):
    """
    Initiates a connection to a third-party provider.
    Redirects to the frontend's mock OAuth connection page.
    """
    provider = provider.lower()
    # Redirect to the frontend's callback/simulation page
    frontend_callback_url = (
        f"http://localhost:3000/dashboard/integrations/callback?provider={provider}"
    )
    return RedirectResponse(url=frontend_callback_url)


@integrations_router.post("/callback/{provider}")
async def integration_callback(provider: str):
    """
    Marks the provider as connected.
    """
    provider = provider.lower()
    MOCK_USER_INTEGRATIONS[provider] = True
    return {"status": "success", "provider": provider, "connected": True}
