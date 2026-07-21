"""
Meta Go — On-chain Relayer
==========================
Submits real transactions to the local Hardhat node on behalf of users.
This is the "gasless" account-abstraction pattern: the user signs the intent
client-side, the backend pays gas and dispatches.

Features:
1. Redis-based Nonce Management (Reconciled with blockchain state).
2. RPC Failover Pool with continuous health checks and recovery.
"""
import json
import os
import time
import secrets
import logging
import threading
from typing import Dict, Any, Optional

from web3 import Web3
from .config import cfg
from eth_account import Account
import redis

# Configure logging
logger = logging.getLogger("relayer")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

HARDHAT_RPC = os.environ.get("HARDHAT_RPC", "http://127.0.0.1:8545")
DEPLOYER_KEY = os.environ.get("DEPLOYER_KEY")
IS_EPHEMERAL = False

# Hardening TEST_MODE configuration on startup
is_test_mode = getattr(cfg, 'TEST_MODE', False) or (os.environ.get("TEST_MODE") == "1")
env = os.environ.get("ENV") or getattr(cfg, 'ENV', 'dev')
mongo_url = cfg.MONGO_URL or os.environ.get("MONGO_URL", "")
rpc_pool_urls = os.environ.get("RPC_POOL_URLS", "")

if is_test_mode:
    if env == "production":
        raise RuntimeError("CRITICAL SECURITY VIOLATION: TEST_MODE is enabled in production environment.")
    if mongo_url and "mongodb+srv://" in mongo_url:
        raise RuntimeError("CRITICAL SECURITY VIOLATION: TEST_MODE is enabled but production MongoDB URI is configured.")
    if rpc_pool_urls:
        for rpc in rpc_pool_urls.split(","):
            if any(prod in rpc for prod in ["infura.io", "alchemyapi.io", "alchemy.com", "quicknode.pro", "quicknode.com", "mainnet", "polygon-rpc"]):
                raise RuntimeError("CRITICAL SECURITY VIOLATION: TEST_MODE is enabled but production RPC URL is configured.")

if not DEPLOYER_KEY:
    if is_test_mode:
        acct = Account.create()
        DEPLOYER_KEY = acct.key.hex()
        IS_EPHEMERAL = True
        logger.warning("[WARNING] EPHEMERAL TEST KEY GENERATED")
    else:
        raise RuntimeError("CRITICAL CONFIGURATION ERROR: DEPLOYER_KEY environment variable is not set.")

ADDR_FILE = os.path.abspath(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "contracts-hardhat",
        "deployed-addresses.json",
    )
)

SBT_ABI = json.loads(
    """[
    {"inputs":[{"internalType":"address","name":"to","type":"address"},
               {"internalType":"string","name":"domain","type":"string"},
               {"internalType":"string","name":"uri","type":"string"}],
     "name":"mint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
     "stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"","type":"address"}],
     "name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
     "stateMutability":"view","type":"function"},
    {"anonymous":false,"inputs":[
       {"indexed":true,"internalType":"address","name":"to","type":"address"},
       {"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},
       {"indexed":false,"internalType":"string","name":"domain","type":"string"}],
     "name":"Minted","type":"event"}
]"""
)


class RPCFailoverPool:
    def __init__(self, rpc_urls: list):
        self.rpc_urls = rpc_urls
        self.primary_url = rpc_urls[0] if rpc_urls else "http://127.0.0.1:8545"
        self.current_index = 0
        self.health_lock = threading.RLock()
        with self.health_lock:
            self.health_status = {}
            for url in rpc_urls:
                self.health_status[url] = {
                    "status": "HEALTHY",
                    "latency_ms": 0.0,
                    "last_success": None,
                    "last_failure": None,
                    "consecutive_failures": 0,
                    "consecutive_successes": 0,
                    "history": []
                }
        self.w3_instances = {url: Web3(Web3.HTTPProvider(url, request_kwargs={"timeout": 2})) for url in rpc_urls}
        self.check_interval = 15
        self._stop_monitor = False

    def check_health(self) -> None:
        """Pings all providers and tracks latency/consecutive failures/state machine transitions."""
        for url in self.rpc_urls:
            w3 = self.w3_instances[url]
            start = time.time()
            is_timeout = False
            try:
                if w3.is_connected():
                    latency = time.time() - start
                    latency_ms = latency * 1000.0
                    with self.health_lock:
                        status_info = self.health_status[url]
                        status_info["latency_ms"] = latency_ms
                        status_info["last_success"] = time.time()
                        status_info["consecutive_failures"] = 0
                        status_info["consecutive_successes"] += 1
                        
                        # Record sliding history (max 10 elements)
                        status_info["history"].append({"success": True, "timeout": False, "latency": latency_ms})
                        if len(status_info["history"]) > 10:
                            status_info["history"].pop(0)
                        
                        # State Machine: UNHEALTHY -> HEALTHY after 5 consecutive successes
                        if status_info["status"] == "UNHEALTHY" and status_info["consecutive_successes"] >= 5:
                            status_info["status"] = "HEALTHY"
                            logger.info(f"[STATE MACHINE] RPC {url} recovered to HEALTHY.")
                        elif status_info["status"] == "DEGRADED":
                            status_info["status"] = "HEALTHY"
                            logger.info(f"[STATE MACHINE] RPC {url} restored to HEALTHY.")
                else:
                    raise ConnectionError("Ping failed")
            except Exception as e:
                try:
                    from .observability import increment_counter
                except Exception:
                    from observability import increment_counter
                increment_counter("rpc_failures_total")
                is_timeout = "timeout" in str(e).lower() or "timed out" in str(e).lower()
                with self.health_lock:
                    status_info = self.health_status[url]
                    status_info["latency_ms"] = -1.0
                    status_info["last_failure"] = time.time()
                    status_info["consecutive_successes"] = 0
                    status_info["consecutive_failures"] += 1
                    
                    status_info["history"].append({"success": False, "timeout": is_timeout, "latency": -1.0})
                    if len(status_info["history"]) > 10:
                        status_info["history"].pop(0)
                    
                    # State Machine Transitions
                    if status_info["consecutive_failures"] >= 5:
                        if status_info["status"] != "UNHEALTHY":
                            status_info["status"] = "UNHEALTHY"
                            logger.warning(f"[ALERT] RPC {url} marked UNHEALTHY.")
                    elif status_info["consecutive_failures"] >= 2:
                        if status_info["status"] == "HEALTHY":
                            status_info["status"] = "DEGRADED"
                            logger.warning(f"[WARNING] RPC {url} marked DEGRADED.")

    def start_health_monitor(self) -> None:
        """Starts background daemon thread for periodic health monitoring."""
        self._stop_monitor = False
        self._monitor_thread = threading.Thread(target=self._health_monitor_loop, daemon=True)
        self._monitor_thread.start()

    def _health_monitor_loop(self) -> None:
        while not self._stop_monitor:
            self.check_health()
            time.sleep(self.check_interval)

    def get_health_report(self) -> dict:
        nodes = []
        with self.health_lock:
            for url in self.rpc_urls:
                status_info = self.health_status[url]
                nodes.append({
                    "url": url,
                    "status": status_info["status"],
                    "latency": status_info["latency_ms"],
                    "failures": status_info["consecutive_failures"],
                    "last_success": status_info["last_success"],
                    "last_failure": status_info["last_failure"]
                })
            active_w3 = self.get_w3()
        return {
            "active_rpc": active_w3.provider.endpoint_uri,
            "nodes": nodes
        }

    def get_w3(self) -> Web3:
        """Returns the current healthy Web3 instance using lowest score = latency + error_rate + timeout_rate selection."""
        with self.health_lock:
            best_url = None
            best_score = float('inf')
            
            for url in self.rpc_urls:
                status_info = self.health_status[url]
                if status_info["status"] == "UNHEALTHY":
                    continue
                    
                hist = status_info["history"]
                if not hist:
                    score = 100.0
                else:
                    total = len(hist)
                    failures = sum(1 for x in hist if not x["success"])
                    timeouts = sum(1 for x in hist if x["timeout"])
                    error_rate = (failures / total) * 100.0
                    timeout_rate = (timeouts / total) * 100.0
                    
                    success_latencies = [x["latency"] for x in hist if x["success"]]
                    avg_latency = sum(success_latencies) / len(success_latencies) if success_latencies else 1000.0
                    
                    score = avg_latency + error_rate + timeout_rate
                
                if score < best_score:
                    best_score = score
                    best_url = url
            
            if best_url:
                self.current_index = self.rpc_urls.index(best_url)
            else:
                best_url = self.primary_url
                self.current_index = 0
                
            return self.w3_instances[best_url]


class RedisNonceManager:
    def __init__(self, host: str, port: int, w3_pool: RPCFailoverPool, deployer_addr: str, chain_id: int):
        self.host = host
        self.port = port
        self.w3_pool = w3_pool
        self.deployer_addr = deployer_addr
        self.chain_id = chain_id
        self.key = f"relayer:nonce:{self.chain_id}"
        self.is_ready = False
        self.r = None
        # Refuse initialization if Redis is unreachable on startup (Fail-Closed)
        try:
            self.r = redis.Redis(host=self.host, port=self.port, db=0, socket_timeout=2, socket_connect_timeout=2)
            self.r.ping()
        except Exception as e:
            try:
                from .observability import increment_counter
            except Exception:
                from observability import increment_counter
            increment_counter("redis_failures_total")
            logger.critical(f"CRITICAL Nonce Safety Event: Redis is unreachable during startup: {e}")
            raise RuntimeError(f"CRITICAL CONFIGURATION ERROR: Redis is unreachable: {e}")

    def reconcile_nonce(self) -> bool:
        """Startup/periodic reconciliation loop for the relayer nonce."""
        if not self.r:
            logger.critical("CRITICAL Nonce Safety Event: Nonce reconciliation failed due to offline Redis client.")
            self.is_ready = False
            return False
        try:
            self.r.ping()
            w3 = self.w3_pool.get_w3()
            onchain_nonce = w3.eth.get_transaction_count(self.deployer_addr, "pending")
            redis_nonce_raw = self.r.get(self.key)
            redis_nonce = int(redis_nonce_raw) if redis_nonce_raw is not None else -1

            # Redis Split-Brain Protection: Refuse startup if redis_nonce > chain_nonce + 5
            if redis_nonce != -1:
                if redis_nonce > onchain_nonce + 5:
                    logger.critical(f"CRITICAL Nonce Safety Event: Nonce split-brain detected! Redis nonce ({redis_nonce}) > on-chain pending nonce ({onchain_nonce}) + 5.")
                    self.is_ready = False
                    raise RuntimeError("Nonce split-brain protection triggered. Halting startup.")

            try:
                from .observability import set_gauge
            except Exception:
                from observability import set_gauge

            if redis_nonce_raw is None or onchain_nonce > redis_nonce:
                drift = onchain_nonce - redis_nonce if redis_nonce != -1 else 0
                set_gauge("nonce_drift", float(drift))
                self.r.set(self.key, onchain_nonce)
                logger.info(f"[NONCE RECONCILIATION] Reconciled. Redis set to {onchain_nonce} (Drift: {drift})")
                if drift > 5:
                    logger.warning(f"[ALERT] Nonce drift exceeded threshold: {drift}")
            else:
                set_gauge("nonce_drift", 0.0)
                logger.info(f"[NONCE RECONCILIATION] Synced at {redis_nonce}")
            self.is_ready = True
            return True
        except Exception as e:
            try:
                from .observability import increment_counter
            except Exception:
                from observability import increment_counter
            increment_counter("redis_failures_total")
            logger.critical(f"CRITICAL Nonce Safety Event: Nonce reconciliation failed: {e}")
            self.is_ready = False
            raise RuntimeError(f"Nonce reconciliation failed: {e}")

    def acquire_lock(self, timeout_ms: int = 5000) -> Optional[str]:
        if not self.r:
            return None
        lock_key = f"lock:relayer:nonce:{self.chain_id}"
        token = secrets.token_hex(16)
        start_time = time.time()
        while time.time() - start_time < (timeout_ms / 1000.0):
            try:
                if self.r.set(lock_key, token, nx=True, px=timeout_ms):
                    return token
            except Exception:
                pass
            time.sleep(0.05)
        return None

    def release_lock(self, token: str) -> bool:
        if not self.r:
            return False
        lock_key = f"lock:relayer:nonce:{self.chain_id}"
        lua_release = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        try:
            self.r.eval(lua_release, 1, lock_key, token)
            return True
        except Exception:
            return False

    def acquire_nonce(self) -> int:
        """Acquires next sequential nonce. Fails closed when nonce synchronization cannot be guaranteed."""
        if not self.r or not self.is_ready:
            logger.critical("CRITICAL Nonce Safety Event: Nonce acquisition attempted but NonceManager is not ready/offline.")
            raise RuntimeError("Nonce safety cannot be guaranteed: NonceManager not ready.")
        
        token = self.acquire_lock()
        if not token:
            logger.critical("CRITICAL Nonce Safety Event: Nonce lock acquisition timed out. Failing closed.")
            raise RuntimeError("Nonce safety cannot be guaranteed: Lock acquisition timed out.")
            
        try:
            self.r.ping()
            return self.r.incrby(self.key, 1) - 1
        except Exception as e:
            try:
                from .observability import increment_counter
            except Exception:
                from observability import increment_counter
            increment_counter("redis_failures_total")
            logger.critical(f"CRITICAL Nonce Safety Event: Redis nonce increment failed: {e}")
            self.is_ready = False
            raise RuntimeError(f"Nonce safety cannot be guaranteed: Redis increment failed: {e}")
        finally:
            self.release_lock(token)


class RelayerClient:
    """Singleton-style on-chain relayer."""

    def __init__(self):
        self.w3_pool: Optional[RPCFailoverPool] = None
        self.nonce_manager: Optional[RedisNonceManager] = None
        self.addresses: Dict[str, str] = {}
        self.deployer_addr: Optional[str] = None
        self._init()

    def _init(self):
        try:
            urls = os.environ.get("RPC_POOL_URLS", HARDHAT_RPC).split(",")
            self.w3_pool = RPCFailoverPool(urls)
            self.w3_pool.check_health()
            self.w3_pool.start_health_monitor()
            w3 = self.w3_pool.get_w3()

            if os.path.exists(ADDR_FILE):
                data = json.load(open(ADDR_FILE))
                self.addresses = data.get("contracts", {})
            acct = Account.from_key(DEPLOYER_KEY)
            self.deployer_addr = acct.address
            
            chain_id = w3.eth.chain_id if w3 else 31337
            self.nonce_manager = RedisNonceManager(
                host=os.environ.get("REDIS_HOST", "localhost"),
                port=int(os.environ.get("REDIS_PORT", 6379)),
                w3_pool=self.w3_pool,
                deployer_addr=self.deployer_addr,
                chain_id=chain_id
            )
            self.nonce_manager.reconcile_nonce()
        except Exception as e:
            logger.error(f"RelayerClient init failed: {e}")

    @property
    def w3(self) -> Optional[Web3]:
        if not self.w3_pool:
            return None
        return self.w3_pool.get_w3()

    def available(self) -> bool:
        return self.w3 is not None and bool(self.addresses) and self.nonce_manager is not None and self.nonce_manager.is_ready

    def _estimate_and_check_gas(self, tx_function, from_addr) -> int:
        MAX_GAS_LIMIT = 600_000
        MAX_GAS_PRICE = 300_000_000_000  # 300 Gwei
        MAX_TX_COST = MAX_GAS_LIMIT * MAX_GAS_PRICE
        
        try:
            from .observability import increment_counter, set_gauge
        except Exception:
            from observability import increment_counter, set_gauge

        try:
            balance = self.w3.eth.get_balance(self.deployer_addr)
            set_gauge("wallet_balance_wei", float(balance))
        except Exception:
            pass

        gas_price = self.w3.eth.gas_price
        if gas_price > MAX_GAS_PRICE:
            increment_counter("gas_spikes_total")
            logger.critical(f"CRITICAL: gasPrice ({gas_price}) exceeds MAX_GAS_PRICE ({MAX_GAS_PRICE})")
            raise RuntimeError(f"Gas price circuit breaker triggered: {gas_price} > {MAX_GAS_PRICE}")
            
        try:
            raw_tx = tx_function.build_transaction({
                "from": from_addr,
                "nonce": 0,
            })
            estimated = self.w3.eth.estimate_gas(raw_tx)
        except Exception as e:
            logger.warning(f"Gas estimation failed, using fallback: {e}")
            estimated = 400_000
            
        gas_limit = int(estimated * 1.20)
        if gas_limit > MAX_GAS_LIMIT:
            increment_counter("gas_spikes_total")
            logger.critical(f"CRITICAL: Estimated gas limit ({gas_limit}) exceeds MAX_GAS_LIMIT ({MAX_GAS_LIMIT})")
            raise RuntimeError(f"Gas limit circuit breaker triggered: {gas_limit} > {MAX_GAS_LIMIT}")
            
        tx_cost = gas_limit * gas_price
        if tx_cost > MAX_TX_COST:
            increment_counter("gas_spikes_total")
            logger.critical(f"CRITICAL: Transaction cost ({tx_cost}) exceeds MAX_TX_COST ({MAX_TX_COST})")
            raise RuntimeError(f"Transaction cost circuit breaker triggered: {tx_cost} > {MAX_TX_COST}")
            
        return gas_limit

    def mint_sbt(self, recipient: str, domain: str, uri: str) -> Dict[str, Any]:
        if IS_EPHEMERAL:
            logger.warning("Transaction disabled: Ephemeral test key is active.")
            return {"ok": False, "reason": "Disabled on ephemeral key", "mode": "simulation"}
        if not self.available():
            return {"ok": False, "reason": "relayer-unavailable", "mode": "simulation"}
        try:
            sbt_addr = self.addresses["CelestialSBT"]
            contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(sbt_addr), abi=SBT_ABI
            )
            recipient_cs = Web3.to_checksum_address(recipient)
            nonce = self.nonce_manager.acquire_nonce()
            
            tx_func = contract.functions.mint(recipient_cs, domain, uri)
            gas_limit = self._estimate_and_check_gas(tx_func, self.deployer_addr)
            
            tx = tx_func.build_transaction({
                "from": self.deployer_addr,
                "nonce": nonce,
                "gas": gas_limit,
                "gasPrice": self.w3.eth.gas_price,
                "chainId": self.w3.eth.chain_id,
            })
            signed = Account.sign_transaction(tx, DEPLOYER_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=20)
            token_id = None
            try:
                logs = contract.events.Minted().process_receipt(receipt)
                if logs:
                    token_id = int(logs[0]["args"]["tokenId"])
            except Exception:
                pass
            return {
                "ok": receipt.status == 1,
                "mode": "real",
                "txHash": tx_hash.hex(),
                "tokenId": token_id,
                "blockNumber": receipt.blockNumber,
                "gasUsed": receipt.gasUsed,
                "contract": sbt_addr,
                "chainId": self.w3.eth.chain_id,
            }
        except Exception as e:
            return {"ok": False, "reason": str(e), "mode": "error"}

    def get_balance(self, address: str) -> Optional[int]:
        if not self.available():
            return None
        try:
            sbt_addr = self.addresses["CelestialSBT"]
            contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(sbt_addr), abi=SBT_ABI
            )
            return int(contract.functions.balanceOf(Web3.to_checksum_address(address)).call())
        except Exception:
            return None

    def register_user_onchain(self, wallet_address: str, handle: str, did: str) -> Dict[str, Any]:
        """Calls IdentityRegistry.registerCrossChain to anchor identity on-chain via Relayer deployer."""
        if IS_EPHEMERAL:
            logger.warning("Transaction disabled: Ephemeral test key is active.")
            return {"ok": False, "reason": "Disabled on ephemeral key"}
        if not self.available():
            return {"ok": False, "reason": "relayer-unavailable"}
        try:
            registry_addr = self.addresses["IdentityRegistry"]
            contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(registry_addr),
                abi=[{
                    "inputs": [
                        {"internalType": "address", "name": "_wallet", "type": "address"},
                        {"internalType": "string", "name": "_handle", "type": "string"},
                        {"internalType": "string", "name": "_did", "type": "string"}
                    ],
                    "name": "registerCrossChain",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }]
            )
            nonce = self.nonce_manager.acquire_nonce()
            wallet_cs = Web3.to_checksum_address(wallet_address)
            tx_func = contract.functions.registerCrossChain(wallet_cs, handle, did)
            gas_limit = self._estimate_and_check_gas(tx_func, self.deployer_addr)
            
            tx = tx_func.build_transaction({
                "from": self.deployer_addr,
                "nonce": nonce,
                "gas": gas_limit,
                "gasPrice": self.w3.eth.gas_price,
                "chainId": self.w3.eth.chain_id,
            })
            signed = Account.sign_transaction(tx, DEPLOYER_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=20)
            return {
                "ok": receipt.status == 1,
                "txHash": tx_hash.hex(),
                "blockNumber": receipt.blockNumber
            }
        except Exception as e:
            return {"ok": False, "reason": str(e)}

    def initiate_recovery(self, old_wallet: str, passphrase_hash: str, new_wallet: str, new_did: str) -> Dict[str, Any]:
        if IS_EPHEMERAL:
            logger.warning("Transaction disabled: Ephemeral test key is active.")
            return {"ok": False, "reason": "Disabled on ephemeral key"}
        if not self.available():
            return {"ok": False, "reason": "relayer-unavailable"}
        try:
            registry_addr = self.addresses["IdentityRegistry"]
            contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(registry_addr),
                abi=[{
                    "inputs": [
                        {"internalType": "address", "name": "_oldWallet", "type": "address"},
                        {"internalType": "bytes32", "name": "_passphraseHash", "type": "bytes32"},
                        {"internalType": "address", "name": "_newWallet", "type": "address"},
                        {"internalType": "string", "name": "_newDid", "type": "string"}
                    ],
                    "name": "initiateRecovery",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }]
            )
            old_cs = Web3.to_checksum_address(old_wallet)
            new_cs = Web3.to_checksum_address(new_wallet)
            
            h_str = passphrase_hash.replace("0x", "")
            pass_bytes = self.w3.to_bytes(hexstr="0x" + h_str)

            nonce = self.nonce_manager.acquire_nonce()
            tx_func = contract.functions.initiateRecovery(old_cs, pass_bytes, new_cs, new_did)
            gas_limit = self._estimate_and_check_gas(tx_func, self.deployer_addr)
            
            tx = tx_func.build_transaction({
                "from": self.deployer_addr,
                "nonce": nonce,
                "gas": gas_limit,
                "gasPrice": self.w3.eth.gas_price,
                "chainId": self.w3.eth.chain_id,
            })
            signed = Account.sign_transaction(tx, DEPLOYER_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=20)
            return {
                "ok": receipt.status == 1,
                "txHash": tx_hash.hex(),
                "blockNumber": receipt.blockNumber
            }
        except Exception as e:
            return {"ok": False, "reason": str(e)}

    def sync_cross_chain_for(self, user: str, selector: int) -> Dict[str, Any]:
        if IS_EPHEMERAL:
            logger.warning("Transaction disabled: Ephemeral test key is active.")
            return {"ok": False, "reason": "Disabled on ephemeral key"}
        if not self.available():
            return {"ok": False, "reason": "relayer-unavailable"}
        try:
            registry_addr = self.addresses["IdentityRegistry"]
            contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(registry_addr),
                abi=[{
                    "inputs": [
                        {"internalType": "address", "name": "_user", "type": "address"},
                        {"internalType": "uint64", "name": "_destinationChainSelector", "type": "uint64"}
                    ],
                    "name": "syncCrossChainFor",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }]
            )
            nonce = self.nonce_manager.acquire_nonce()
            tx_func = contract.functions.syncCrossChainFor(
                Web3.to_checksum_address(user), selector
            )
            gas_limit = self._estimate_and_check_gas(tx_func, self.deployer_addr)
            
            tx = tx_func.build_transaction({
                "from": self.deployer_addr,
                "nonce": nonce,
                "gas": gas_limit,
                "gasPrice": self.w3.eth.gas_price,
                "chainId": self.w3.eth.chain_id,
            })
            signed = Account.sign_transaction(tx, DEPLOYER_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=10)
            return {"ok": receipt.status == 1, "txHash": tx_hash.hex(), "blockNumber": receipt.blockNumber}
        except Exception as e:
            return {"ok": False, "reason": str(e)}


# Singleton relayer client instance
relayer = RelayerClient()
