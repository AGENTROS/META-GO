from fastapi import FastAPI
from contextlib import asynccontextmanager
from core_services.config import get_settings
from api_gateway.database import connect_to_mongo, close_mongo_connection
from api_gateway.middlewares import StructuredLoggingMiddleware
from api_gateway.responses import global_exception_handler
from api_gateway.routes import health
from core_services.identity_engine.api import router as identity_router
from core_services.biometric_engine.api import router as biometric_router
from core_services.consent_engine.api import router as consent_router
from core_services.ai_guardian.api import router as guardian_router
from core_services.avatar_engine.api import router as avatar_router
from api_gateway.routes import events as events_router
from api_gateway.routes import biometrics_legacy as biometrics_legacy_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Events
    await connect_to_mongo()
    yield
    # Shutdown Events
    await close_mongo_connection()


settings = get_settings()

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Middlewares
app.add_middleware(StructuredLoggingMiddleware)

# Global Exception Handlers
app.add_exception_handler(Exception, global_exception_handler)

# Routers
app.include_router(health.router)
app.include_router(identity_router.router)
app.include_router(biometric_router.router)
app.include_router(consent_router.router)
app.include_router(guardian_router.router)
app.include_router(avatar_router.router)
app.include_router(events_router.router)
app.include_router(biometrics_legacy_router.router)
