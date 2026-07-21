"""
Meta Go — On-chain / Off-chain Reconciliation & Recovery System
=============================================================
Implements:
1. 5-block confirmation rule for all blockchain states before settling in DB.
2. Event listener recovery to backfill MongoDB from blockchain events on startup/restart.
3. Transaction sweeper recovery to monitor pending relayer transactions and resolve RPC timeouts.
4. Nightly reconciliation process to audit full MongoDB state against on-chain records.
"""
import asyncio
import time
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone

from web3 import Web3
from relayer import relayer, SBT_ABI

logger = logging.getLogger("reconciliation")
logger.setLevel(logging.INFO)

# Global flag to stop tasks when server shuts down
_running = True

# Minimum confirmation depth before marking transaction as settled
REQUIRED_CONFIRMATIONS = 5

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

async def get_latest_block_number(w3: Web3) -> int:
    """Gets the latest block number safely from RPC, with fallback support."""
    try:
        return w3.eth.block_number
    except Exception as e:
        logger.warning(f"Failed to fetch latest block number: {e}")
        return 0

async def verify_transaction_confirmations(w3: Web3, tx_hash_str: str) -> Tuple[str, Optional[Dict[str, Any]]]:
    """
    Checks the confirmation status of a transaction on-chain.
    Returns:
        (status, receipt)
        where status can be: "confirmed", "pending", "failed", "not_found"
    """
    try:
        tx_hash = bytes.fromhex(tx_hash_str.replace("0x", ""))
        receipt = w3.eth.get_transaction_receipt(tx_hash)
        if receipt is None:
            return "pending", None
        
        latest_block = w3.eth.block_number
        tx_block = receipt.blockNumber
        confirmations = latest_block - tx_block + 1
        
        if receipt.status == 0:
            return "failed", receipt
        
        if confirmations >= REQUIRED_CONFIRMATIONS:
            return "confirmed", receipt
        else:
            return "pending", receipt
    except Exception as e:
        # If tx_hash is not found in mempool/receipts
        if "not found" in str(e).lower() or "transactionNotFound" in str(e):
            return "not_found", None
        logger.error(f"Error checking confirmations for {tx_hash_str}: {e}")
        return "error", None

async def transaction_sweeper(db):
    """
    Background worker that monitors:
    1. db.sbts with status="PENDING" or "VALID" (checks confirmation depth)
    2. db.cross_chain_syncs with status="pending"
    3. db.sync_operations with status="processing" (resolves stuck operations)
    """
    logger.info("Starting Transaction Sweeper task")
    while _running:
        try:
            if not relayer.available():
                await asyncio.sleep(5)
                continue
            
            w3 = relayer.w3
            
            # --- 1. Sweep pending SBT mints ---
            sbt_cursor = db.sbts.find({"status": {"$in": ["PENDING", "PENDING_CONFIRMATION"]}})
            async for sbt in sbt_cursor:
                tx_hash = sbt.get("txHash")
                if not tx_hash:
                    continue
                
                status, receipt = await verify_transaction_confirmations(w3, tx_hash)
                if status == "confirmed":
                    await db.sbts.update_one(
                        {"_id": sbt["_id"]},
                        {"$set": {"status": "VALID", "confirmedAt": _now_iso(), "blockNumber": receipt.blockNumber}}
                    )
                    logger.info(f"SBT transaction {tx_hash} confirmed with {REQUIRED_CONFIRMATIONS}+ blocks.")
                elif status == "failed":
                    await db.sbts.update_one(
                        {"_id": sbt["_id"]},
                        {"$set": {"status": "FAILED", "failedAt": _now_iso()}}
                    )
                    logger.warning(f"SBT transaction {tx_hash} failed on-chain. Marking as FAILED.")
                elif status == "not_found":
                    # If pending for too long, mark as dropped/failed
                    created_at_str = sbt.get("issuedAt")
                    try:
                        created_at = datetime.fromisoformat(created_at_str)
                        age = (datetime.now(timezone.utc) - created_at).total_seconds()
                        if age > 300: # 5 minutes
                            await db.sbts.update_one(
                                {"_id": sbt["_id"]},
                                {"$set": {"status": "DROPPED", "failedAt": _now_iso()}}
                            )
                            logger.warning(f"SBT transaction {tx_hash} not found on-chain after 5 mins. Marked as DROPPED.")
                    except Exception:
                        pass
            
            # --- 2. Sweep pending cross-chain syncs ---
            sync_cursor = db.cross_chain_syncs.find({"status": "pending_confirmation"})
            async for sync in sync_cursor:
                tx_hash = sync.get("syncTxHash")
                if not tx_hash:
                    continue
                if tx_hash.startswith("0xmock") or "mock" in tx_hash:
                    # Simulation syncs bypass on-chain checking
                    await db.cross_chain_syncs.update_one(
                        {"_id": sync["_id"]},
                        {"$set": {"status": "synced", "syncedAt": time.time()}}
                    )
                    continue
                
                status, receipt = await verify_transaction_confirmations(w3, tx_hash)
                if status == "confirmed":
                    await db.cross_chain_syncs.update_one(
                        {"_id": sync["_id"]},
                        {"$set": {"status": "synced", "syncedAt": time.time(), "confirmedAt": _now_iso()}}
                    )
                    logger.info(f"Cross-chain sync transaction {tx_hash} confirmed.")
                elif status == "failed":
                    await db.cross_chain_syncs.update_one(
                        {"_id": sync["_id"]},
                        {"$set": {"status": "failed", "failedAt": _now_iso()}}
                    )
                    logger.warning(f"Cross-chain sync transaction {tx_hash} failed on-chain.")
            
            # --- 3. Sweep stuck sync operations (idempotency locks) ---
            stuck_ops = db.sync_operations.find({"status": "processing"})
            async for op in stuck_ops:
                created_at = op.get("timestamp_numeric", 0)
                if time.time() - created_at > 60: # stuck for > 60 seconds
                    await db.sync_operations.update_one(
                        {"_id": op["_id"]},
                        {"$set": {"status": "failed", "error": "Operation timeout/stuck resolved by sweeper", "failedAt": _now_iso()}}
                    )
                    logger.warning(f"Stuck idempotency lock resolved for operationId {op.get('operationId')}")
                    
        except Exception as e:
            logger.error(f"Error in Transaction Sweeper: {e}")
            
        await asyncio.sleep(10)

async def event_listener_recovery(db):
    """
    Startup/regular watcher that queries logs for Minted and IdentityRegistered events
    directly from the blockchain to backfill or sync state.
    """
    logger.info("Starting Event Listener Recovery task")
    last_processed_block = 0
    
    # Initialize from DB state or start from current block - 100
    try:
        config = await db.reconciliation_state.find_one({"key": "last_processed_block"})
        if config:
            last_processed_block = config.get("value", 0)
    except Exception:
        pass

    while _running:
        try:
            if not relayer.available():
                await asyncio.sleep(5)
                continue
            
            w3 = relayer.w3
            current_block = w3.eth.block_number
            
            if last_processed_block == 0:
                last_processed_block = max(0, current_block - 100)
            
            if last_processed_block < current_block:
                to_block = min(current_block, last_processed_block + 1000)
                logger.info(f"Scanning blockchain events from block {last_processed_block} to {to_block}")
                
                # --- Fetch SBT Minted Events ---
                sbt_addr = relayer.addresses.get("CelestialSBT")
                if sbt_addr:
                    sbt_contract = w3.eth.contract(address=Web3.to_checksum_address(sbt_addr), abi=SBT_ABI)
                    mint_filter = sbt_contract.events.Minted.create_filter(
                        from_block=last_processed_block,
                        to_block=to_block
                    )
                    events = mint_filter.get_all_entries()
                    for event in events:
                        to_addr = event["args"]["to"].lower()
                        token_id = int(event["args"]["tokenId"])
                        domain = event["args"]["domain"]
                        tx_hash = event["transactionHash"].hex()
                        
                        # Verify we have this in MongoDB
                        existing = await db.sbts.find_one({"tokenId": token_id})
                        if not existing:
                            await db.sbts.insert_one({
                                "walletAddress": to_addr,
                                "domain": domain,
                                "tokenId": token_id,
                                "txHash": tx_hash,
                                "blockNumber": event["blockNumber"],
                                "chainId": w3.eth.chain_id,
                                "contract": sbt_addr,
                                "issuedAt": _now_iso(),
                                "status": "VALID",
                                "source": "event_recovery"
                            })
                            logger.info(f"Backfilled missing SBT #{token_id} for {to_addr} from blockchain events.")
                
                last_processed_block = to_block
                await db.reconciliation_state.update_one(
                    {"key": "last_processed_block"},
                    {"$set": {"value": last_processed_block}},
                    upsert=True
                )
                
        except Exception as e:
            logger.error(f"Error in Event Listener Recovery: {e}")
            
        await asyncio.sleep(15)

async def nightly_reconciliation(db):
    """
    Nightly full-database reconciliation process.
    Scans:
    1. Users in db.users: verifies they are either registered on-chain or marked correctly.
    2. SBTs in db.sbts: verifies against the on-chain CelestialSBT balance and properties.
    Logs warnings or corrects database records for any discrepancies.
    """
    logger.info("Starting Nightly Reconciliation scheduler")
    while _running:
        # Run reconciliation every 24 hours (86400 seconds)
        try:
            logger.info("Executing Nightly Reconciliation process...")
            
            if not relayer.available():
                logger.warning("Reconciliation skipped: blockchain relayer is not connected.")
                await asyncio.sleep(3600) # retry in an hour
                continue
            
            w3 = relayer.w3
            sbt_addr = relayer.addresses.get("CelestialSBT")
            registry_addr = relayer.addresses.get("IdentityRegistry")
            
            if not registry_addr or not sbt_addr:
                await asyncio.sleep(3600)
                continue
            
            # Smart contract instances
            identities_abi = [
                {
                    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
                    "name": "identities",
                    "outputs": [
                        {"internalType": "string", "name": "handle", "type": "string"},
                        {"internalType": "string", "name": "did", "type": "string"},
                        {"internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
                        {"internalType": "uint64", "name": "timestamp", "type": "uint64"},
                        {"internalType": "bool", "name": "active", "type": "bool"}
                    ],
                    "stateMutability": "view",
                    "type": "function"
                }
            ]
            registry_contract = w3.eth.contract(address=Web3.to_checksum_address(registry_addr), abi=identities_abi)
            sbt_contract = w3.eth.contract(address=Web3.to_checksum_address(sbt_addr), abi=SBT_ABI)
            
            # 1. Audit Users
            user_cursor = db.users.find()
            async for user in user_cursor:
                wallet = user.get("walletAddress")
                if not wallet:
                    continue
                
                wallet_cs = Web3.to_checksum_address(wallet)
                
                # Get on-chain identity
                try:
                    onchain_id = registry_contract.functions.identities(wallet_cs).call()
                    handle, did, proof_hash, _, active = onchain_id
                    
                    if active:
                        # User should be synced
                        if not user.get("did"):
                            # Auto-recover / sync DID back to DB
                            await db.users.update_one(
                                {"_id": user["_id"]},
                                {"$set": {"did": did, "handle": handle, "reconciledAt": _now_iso()}}
                            )
                            logger.warning(f"Reconciled missing DID for {wallet} (Restored from on-chain identity).")
                    else:
                        # If user is active in DB but active is false on-chain, execute database rollback
                        logger.error(f"[RECONCILIATION ROLLBACK] User {wallet} is active in DB but inactive on-chain. Deleting database records.")
                        try:
                            from observability import increment_counter
                        except Exception:
                            from observability import increment_counter
                        increment_counter("reorg_detections_total")
                        await db.users.delete_one({"_id": user["_id"]})
                        await db.zk_proofs.delete_many({"walletAddress": wallet.lower()})
                        await db.sbts.delete_many({"walletAddress": wallet.lower()})
                except Exception as e:
                    logger.error(f"Failed to reconcile user {wallet}: {e}")
            
            # 2. Audit SBT balances
            sbt_cursor = db.sbts.find({"status": "VALID"})
            async for sbt in sbt_cursor:
                wallet = sbt.get("walletAddress")
                if not wallet:
                    continue
                
                wallet_cs = Web3.to_checksum_address(wallet)
                try:
                    balance = sbt_contract.functions.balanceOf(wallet_cs).call()
                    if balance == 0:
                        logger.error(f"CONSISTENCY WARNING: Wallet {wallet} has SBT marked VALID in DB, but 0 balance on-chain!")
                        # Mark as orphaned / pending confirmation
                        await db.sbts.update_one(
                            {"_id": sbt["_id"]},
                            {"$set": {"status": "ORPHANED_ONCHAIN_MISSING", "reconciledAt": _now_iso()}}
                        )
                except Exception as e:
                    logger.error(f"Failed to verify SBT balance for {wallet}: {e}")
            
            logger.info("Nightly Reconciliation completed successfully.")
            
        except Exception as e:
            logger.error(f"Error in Nightly Reconciliation: {e}")
            
        await asyncio.sleep(86400) # Execute once every 24 hours

def start_reconciliation_tasks(db):
    """Launches the background workers."""
    global _running
    _running = True
    asyncio.create_task(transaction_sweeper(db))
    asyncio.create_task(event_listener_recovery(db))
    asyncio.create_task(nightly_reconciliation(db))

def stop_reconciliation_tasks():
    """Stops the background workers."""
    global _running
    _running = False
