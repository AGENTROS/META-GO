import logging
import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("metago_gateway")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('{"time":"%(asctime)s", "level":"%(levelname)s", "message":%(message)s}')
handler.setFormatter(formatter)
logger.addHandler(handler)

class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        request.state.correlation_id = request_id
        
        start_time = time.time()
        
        # Determine engine from path if possible
        engine = "api_gateway"
        if request.url.path.startswith("/api/v1/identity"):
            engine = "identity_engine"
            
        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            
            log_data = f'{{"request_id": "{request_id}", "engine": "{engine}", "path": "{request.url.path}", "method": "{request.method}", "status_code": {response.status_code}, "latency_ms": {process_time:.2f}}}'
            logger.info(log_data)
            return response
            
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            log_data = f'{{"request_id": "{request_id}", "engine": "{engine}", "path": "{request.url.path}", "method": "{request.method}", "status_code": 500, "latency_ms": {process_time:.2f}, "error": "{str(e)}"}}'
            logger.error(log_data)
            raise
