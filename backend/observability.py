import os
import logging
import requests
import threading
import queue
import time
from typing import Dict, Any

logger = logging.getLogger("observability")
logger.setLevel(logging.INFO)

# In-memory Prometheus counters and gauges
METRICS_LOCK = threading.Lock()
METRICS: Dict[str, float] = {
    "redis_failures_total": 0.0,
    "nonce_drift": 0.0,
    "rpc_failures_total": 0.0,
    "gas_spikes_total": 0.0,
    "wallet_balance_wei": 0.0,
    "proof_failures_total": 0.0,
    "reorg_detections_total": 0.0,
    "duplicate_nullifiers_total": 0.0,
    "duplicate_handles_total": 0.0,
}


def increment_counter(name: str, value: float = 1.0) -> None:
    with METRICS_LOCK:
        if name in METRICS:
            METRICS[name] += value


def set_gauge(name: str, value: float) -> None:
    with METRICS_LOCK:
        if name in METRICS:
            METRICS[name] = value


def get_prometheus_exposition() -> str:
    """Generates the metrics in standard Prometheus Text Exposition Format (v0.0.4)."""
    lines = []
    with METRICS_LOCK:
        for name, val in METRICS.items():
            metric_name = f"metago_{name}"
            metric_type = "counter" if name.endswith("_total") else "gauge"
            help_msg = f"Tracks {name.replace('_', ' ')}"
            lines.append(f"# HELP {metric_name} {help_msg}")
            lines.append(f"# TYPE {metric_name} {metric_type}")
            lines.append(f"{metric_name} {val}")
    return "\n".join(lines) + "\n"


# Sentry initialization
SENTRY_INITIALIZED = False
sentry_dsn = os.environ.get("SENTRY_DSN")
if sentry_dsn:
    try:
        import sentry_sdk

        sentry_sdk.init(
            dsn=sentry_dsn,
            traces_sample_rate=1.0,
            profiles_sample_rate=1.0,
        )
        SENTRY_INITIALIZED = True
        logger.info("Sentry initialized successfully via environment DSN.")
    except ImportError:
        logger.warning(
            "Sentry SDK (sentry-sdk) is not installed. Logs will not be sent to Sentry."
        )


# Loki Non-blocking Background Queue Handler
class LokiQueueHandler(logging.Handler):
    def __init__(self, loki_url: str):
        super().__init__()
        self.loki_url = loki_url.rstrip("/") + "/loki/api/v1/push"
        self.queue = queue.Queue()
        self.stop_event = threading.Event()
        self.worker_thread = threading.Thread(target=self._worker, daemon=True)
        self.worker_thread.start()

    def emit(self, record):
        try:
            log_entry = self.format(record)
            # Avoid blocking main application threads by placing log records on a queue
            self.queue.put_nowait((time.time_ns(), record.levelname, log_entry))
        except Exception:
            self.handleError(record)

    def _worker(self):
        while not self.stop_event.is_set():
            batch = []
            # Gather logs up to 1 second or batch size of 50
            start_time = time.time()
            while len(batch) < 50 and (time.time() - start_time < 1.0):
                try:
                    ns, level, msg = self.queue.get(timeout=0.1)
                    batch.append((ns, level, msg))
                except queue.Empty:
                    break

            if batch:
                payload = {
                    "streams": [
                        {
                            "stream": {
                                "app": "meta-go",
                                "env": os.environ.get("ENV", "production"),
                            },
                            "values": [
                                [str(ns), f"[{level}] {msg}"]
                                for ns, level, msg in batch
                            ],
                        }
                    ]
                }
                try:
                    headers = {"Content-Type": "application/json"}
                    response = requests.post(
                        self.loki_url, json=payload, headers=headers, timeout=2
                    )
                    if response.status_code != 204:
                        logger.warning(
                            f"Loki push failed with status code: {response.status_code}"
                        )
                except Exception as e:
                    # Fail silently in logging thread to prevent raising uncaught errors in core application
                    pass
            else:
                time.sleep(0.5)

    def close(self):
        self.stop_event.set()
        super().close()


loki_url = os.environ.get("LOKI_URL")
if loki_url:
    try:
        loki_handler = LokiQueueHandler(loki_url)
        loki_handler.setFormatter(logging.Formatter("%(message)s"))
        logging.getLogger().addHandler(loki_handler)
        logger.info(f"Grafana Loki logging handler attached to Loki URL: {loki_url}")
    except Exception as e:
        logger.error(f"Failed to attach Grafana Loki logging handler: {e}")
