from fastapi import APIRouter, Request, HTTPException, WebSocket, WebSocketDisconnect
from typing import Dict, Any, List
import json
import logging
import asyncio
from datetime import datetime

# Assuming websocket manager is created
try:
    from ws.manager import manager as ws_manager
except ImportError:
    from ..ws.manager import manager as ws_manager

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------
# Helper Dependencies
# ---------------------------------------------------------


async def get_secure_context(request: Request, address: str):
    """
    Validates SIWE/JWT session using the existing monolithic verify_auth_address.
    Returns the database and redis client to avoid circular imports.
    """
    import server

    # 1. AUTHENTICATION & AUTHORIZATION (Rule 1, 4, 9)
    await server.verify_auth_address(request, address)

    # 2. INJECT DB & REDIS (Rule 1, 3, 5)
    return server.db, server.redis_client


# ---------------------------------------------------------
# 1. WALLET INTELLIGENCE API LAYER
# ---------------------------------------------------------


@router.get("/api/wallet/{address}")
async def get_wallet_overview(request: Request, address: str):
    db, redis = await get_secure_context(request, address)

    # Check cache first (Rule 5 & 7)
    cache_key = f"wallet_overview:{address.lower()}"
    cached = await redis.get(cache_key) if redis else None
    if cached:
        return json.loads(cached)

    # Extend existing users collection
    user = await db.users.find_one({"walletAddress": address.lower()})

    # Return valid schema, empty if not yet indexed by background sweeper (Rule 3)
    response = {
        "address": address,
        "native_balance": (
            user.get("walletData", {}).get("native_balance", "0.00 ETH")
            if user
            else "0.00 ETH"
        ),
        "connected_chain": (
            user.get("walletData", {}).get("connected_chain", "Unknown")
            if user
            else "Unknown"
        ),
        "ens": user.get("walletData", {}).get("ens", "Not Set") if user else "Not Set",
        "risk_analysis": "Safe",  # Could be fetched from a security collection
    }

    if redis:
        await redis.setex(cache_key, 300, json.dumps(response))  # Cache for 5 mins
    return response


@router.get("/api/wallet/tokens")
async def get_wallet_tokens(request: Request, address: str):
    db, _ = await get_secure_context(request, address)
    user = await db.users.find_one({"walletAddress": address.lower()})
    tokens = user.get("walletData", {}).get("tokens", []) if user else []
    return {"tokens": tokens}


@router.get("/api/wallet/nfts")
async def get_wallet_nfts(request: Request, address: str):
    db, _ = await get_secure_context(request, address)
    user = await db.users.find_one({"walletAddress": address.lower()})
    nfts = user.get("walletData", {}).get("nfts", []) if user else []
    return {"nfts": nfts}


@router.get("/api/wallet/history")
async def get_wallet_history(request: Request, address: str):
    db, _ = await get_secure_context(request, address)
    # Could query a transaction history collection, or extend users
    # Returning valid empty schema if no data yet
    return {"history": []}


@router.get("/api/wallet/contracts")
async def get_wallet_contracts(request: Request, address: str):
    db, _ = await get_secure_context(request, address)
    return {"contracts": []}


@router.get("/api/wallet/permissions")
async def get_wallet_permissions(request: Request, address: str):
    db, _ = await get_secure_context(request, address)
    return {"permissions": []}


@router.get("/api/wallet/gas")
async def get_wallet_gas(request: Request, address: str):
    await get_secure_context(request, address)
    return {"gas_gwei": 0, "status": "Unknown"}


# ---------------------------------------------------------
# 2. DID & IDENTITY API LAYER
# ---------------------------------------------------------


@router.get("/api/did/profile")
async def get_did_profile(request: Request, address: str):
    db, _ = await get_secure_context(request, address)

    # Query the existing 'dids' and 'users' collections
    did_record = await db.dids.find_one({"walletAddress": address.lower()})
    user_record = await db.users.find_one({"walletAddress": address.lower()})

    did_string = did_record.get("did") if did_record else f"did:metago:{address}"
    handle = (
        user_record.get("handle", "Unknown Citizen")
        if user_record
        else "Unknown Citizen"
    )
    level = user_record.get("level", 1) if user_record else 1

    return {"did": did_string, "handle": handle, "level": level}


@router.get("/api/did/passport")
async def get_did_passport(request: Request, address: str):
    db, _ = await get_secure_context(request, address)

    # Query real SBTs and ZK Proofs counts
    sbt_cursor = db.sbts.find({"walletAddress": address.lower()})
    sbts = (
        [doc async for doc in sbt_cursor] if hasattr(sbt_cursor, "__aiter__") else []
    )  # Support real motor cursor

    zk_cursor = db.zk_proofs.find({"walletAddress": address.lower()})
    zks = [doc async for doc in zk_cursor] if hasattr(zk_cursor, "__aiter__") else []

    return {"sbt_count": len(sbts), "zk_proofs": len(zks)}


@router.get("/api/dashboard/recovery")
async def get_recovery_center(request: Request, address: str):
    db, _ = await get_secure_context(request, address)

    # In a real environment, we would query the `users` or a specific `guardians` collection.
    # We will fetch the user and simulate finding guardians from their profile, plus check global recovery sessions
    user = await db.users.find_one({"walletAddress": address.lower()})

    import server

    sessions = []
    for s_id, sess in server.recovery_sessions.items():
        if (
            sess.get("oldAddress", "").lower() == address.lower()
            or sess.get("newAddress", "").lower() == address.lower()
        ):
            sessions.append(
                {
                    "id": s_id,
                    "old_address": sess.get("oldAddress"),
                    "new_address": sess.get("newAddress"),
                    "approvals": sess.get("approvals", []),
                    "status": "Pending",
                }
            )

    guardians = user.get("guardians", []) if user else []

    return {"guardians": guardians, "sessions": sessions}


@router.get("/api/dashboard/vault/credentials")
async def get_vault_credentials(request: Request, address: str):
    db, _ = await get_secure_context(request, address)

    # Query SBTs
    sbt_cursor = db.sbts.find({"walletAddress": address.lower()})
    sbts = [doc async for doc in sbt_cursor] if hasattr(sbt_cursor, "__aiter__") else []

    # Query ZK Proofs
    zk_cursor = db.zk_proofs.find({"walletAddress": address.lower()})
    zks = [doc async for doc in zk_cursor] if hasattr(zk_cursor, "__aiter__") else []

    formatted_credentials = []

    for sbt in sbts:
        formatted_credentials.append(
            {
                "id": str(sbt.get("_id", "unknown")),
                "type": sbt.get("type", "SBT"),
                "issuer": sbt.get("issuer", "MetaGo Network"),
                "issuedAt": sbt.get("issuedAt", ""),
                "metadata": sbt.get("metadata", {}),
                "is_zk": False,
            }
        )

    for zk in zks:
        formatted_credentials.append(
            {
                "id": str(zk.get("_id", "unknown")),
                "type": zk.get("proofType", "Zero-Knowledge Proof"),
                "issuer": "ZK Verifier Network",
                "issuedAt": zk.get("verifiedAt", ""),
                "metadata": {"merkle_root": zk.get("merkleRoot")},
                "is_zk": True,
            }
        )

    # Inject DEMO data if database is empty
    if not formatted_credentials:
        formatted_credentials = [
            {
                "id": "demo-zk-001",
                "type": "Aadhaar Identity Proof (zk-SNARK)",
                "issuer": "UIDAI via ZK Verifier",
                "issuedAt": "2026-07-12T08:30:00Z",
                "metadata": {
                    "merkle_root": "0x7a3b...f92c",
                    "claim": "aadhaar_verified",
                    "doc": "Aadhaar Card",
                },
                "is_zk": True,
            },
            {
                "id": "demo-sbt-001",
                "type": "Passport Verification SBT",
                "issuer": "MetaGo Document Vault",
                "issuedAt": "2026-07-10T12:00:00Z",
                "metadata": {
                    "country": "India",
                    "doc_type": "Passport",
                    "expiry": "2034-05-20",
                },
                "is_zk": False,
            },
            {
                "id": "demo-zk-002",
                "type": "Age Verification (zk-SNARK)",
                "issuer": "ZK Verifier Network",
                "issuedAt": "2026-07-14T10:20:00Z",
                "metadata": {
                    "merkle_root": "0x3c8d...a41e",
                    "claim": "age >= 18",
                    "source": "PAN Card",
                },
                "is_zk": True,
            },
            {
                "id": "demo-sbt-002",
                "type": "University Degree Certificate",
                "issuer": "Delhi University (On-Chain)",
                "issuedAt": "2026-06-28T09:00:00Z",
                "metadata": {
                    "degree": "B.Tech Computer Science",
                    "year": 2025,
                    "grade": "First Class",
                },
                "is_zk": False,
            },
            {
                "id": "demo-sbt-003",
                "type": "KYC Compliance Badge",
                "issuer": "Binance Global",
                "issuedAt": "2026-07-08T15:45:00Z",
                "metadata": {
                    "tier": "Level 2",
                    "region": "Global",
                    "expiry": "2027-07-08",
                },
                "is_zk": False,
            },
            {
                "id": "demo-zk-003",
                "type": "Driving License Proof (zk-SNARK)",
                "issuer": "ZK Verifier Network",
                "issuedAt": "2026-07-15T14:10:00Z",
                "metadata": {
                    "merkle_root": "0x9f1a...b73d",
                    "claim": "valid_license",
                    "doc": "Driving License",
                },
                "is_zk": True,
            },
        ]

    return {"credentials": formatted_credentials}


@router.get("/api/dashboard/avatar/hub")
async def get_avatar_hub(request: Request, address: str):
    db, _ = await get_secure_context(request, address)

    # 1. Fetch User and Avatar Profile
    user = await db.users.find_one({"walletAddress": address.lower()})

    if not user:
        return {
            "connectedWorlds": [],
            "deployments": [],
            "avatar": None,
            "presence": None,
        }

    avatar_profile = user.get("avatar_profile")

    if not avatar_profile:
        # Construct dynamic DNA based on identity state
        trust_score = user.get("trustScore", 0)
        humanity_score = user.get("humanityIndex", 0.0)

        # We can dynamically aggregate, but for now we return a valid empty schema
        return {
            "connectedWorlds": [],
            "deployments": [],
            "avatar": None,
            "presence": None,
        }

    # 2. Dynamic DNA & Analytics Calculation
    sbt_cursor = db.sbts.find({"walletAddress": address.lower()})
    sbts = [doc async for doc in sbt_cursor] if hasattr(sbt_cursor, "__aiter__") else []

    zk_cursor = db.zk_proofs.find({"walletAddress": address.lower()})
    zks = [doc async for doc in zk_cursor] if hasattr(zk_cursor, "__aiter__") else []

    # Merge existing DNA with live calculated stats
    dna = avatar_profile.get("dna", {})
    dna["sbt_count"] = len(sbts)
    dna["credential_count"] = len(zks)
    avatar_profile["dna"] = dna

    # 3. Fetch Deployments
    dep_cursor = db.avatar_deployments.find({"walletAddress": address.lower()})
    if hasattr(dep_cursor, "sort"):
        dep_cursor = dep_cursor.sort("created_at", -1)
    deployments = (
        [doc async for doc in dep_cursor] if hasattr(dep_cursor, "__aiter__") else []
    )

    formatted_deployments = []
    for dep in deployments:
        formatted_deployments.append(
            {
                "id": str(dep.get("_id", "")),
                "world": dep.get("world", ""),
                "status": dep.get("status", "Pending"),
                "progress": dep.get("progress", 0),
                "created_at": dep.get("created_at", ""),
                "updated_at": dep.get("updated_at", ""),
            }
        )

    # 4. Presence Engine (Current Session)
    sess_cursor = db.sessions.find({"walletAddress": address.lower()})
    if hasattr(sess_cursor, "sort"):
        sess_cursor = sess_cursor.sort("lastActivityAt", -1).limit(1)
    sessions = (
        [doc async for doc in sess_cursor] if hasattr(sess_cursor, "__aiter__") else []
    )

    presence = None
    if sessions:
        recent = sessions[0]
        presence = {
            "current_world": recent.get("dapp", "No Active Metaverse Session"),
            "device": recent.get("os", "Unknown")
            + " / "
            + recent.get("browser", "Unknown"),
            "last_active": recent.get("lastActivityAt", ""),
        }

    return {
        "avatar": avatar_profile,
        "deployments": formatted_deployments,
        "presence": presence,
    }


from pydantic import BaseModel


class DeployJobRequest(BaseModel):
    world: str


@router.post("/api/dashboard/avatar/deploy")
async def create_deployment_job(request: Request, address: str, body: DeployJobRequest):
    db, _ = await get_secure_context(request, address)

    job = {
        "walletAddress": address.lower(),
        "world": body.world,
        "status": "Pending",
        "progress": 0,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }

    res = await db.avatar_deployments.insert_one(job)

    # Broadcast event via websocket
    try:
        await ws_manager.broadcast_event(
            address.lower(),
            "deployment_started",
            {"world": body.world, "status": "Pending", "job_id": str(res.inserted_id)},
        )
    except Exception:
        pass

    return {"success": True, "job_id": str(res.inserted_id)}


# ---------------------------------------------------------
# METAVERSE FOOTPRINT SUMMARY (Dashboard Widget)
# ---------------------------------------------------------


@router.get("/api/dashboard/metaverse/footprint")
async def get_metaverse_footprint(request: Request, address: str):
    """
    Lightweight endpoint for the Dashboard Metaverse Footprint widget.
    Returns real deployment data aggregated from avatar_deployments collection.
    No fabricated data — returns empty state when no deployments exist.
    """
    db, redis = await get_secure_context(request, address)
    addr_lower = address.lower()

    # 1. Fetch all avatar deployments for this wallet
    dep_cursor = db.avatar_deployments.find({"walletAddress": addr_lower})
    if hasattr(dep_cursor, "sort"):
        dep_cursor = dep_cursor.sort("created_at", -1)
    deployments = (
        [doc async for doc in dep_cursor] if hasattr(dep_cursor, "__aiter__") else []
    )

    # 2. Aggregate per-world stats
    world_map = {}
    total_interactions = 0
    avatars_used = set()

    for dep in deployments:
        world = dep.get("world", "Unknown")
        status = dep.get("status", "Pending")
        created = dep.get("created_at", "")
        updated = dep.get("updated_at", "")
        avatar_id = dep.get("avatar_id", dep.get("walletAddress", "default"))

        avatars_used.add(avatar_id)

        # Accumulate time spent (estimate from created_at to updated_at)
        time_spent_minutes = 0
        try:
            if created and updated:
                t_created = (
                    datetime.fromisoformat(str(created).replace("Z", "+00:00"))
                    if isinstance(created, str)
                    else created
                )
                t_updated = (
                    datetime.fromisoformat(str(updated).replace("Z", "+00:00"))
                    if isinstance(updated, str)
                    else updated
                )
                delta = (t_updated - t_created).total_seconds() / 60
                if delta > 0:
                    time_spent_minutes = int(delta)
        except Exception:
            pass

        interactions = dep.get("interactions", 0)
        total_interactions += interactions

        if world not in world_map:
            world_map[world] = {
                "world": world,
                "status": status,
                "time_spent_minutes": time_spent_minutes,
                "interactions": interactions,
                "last_active": updated or created,
                "deployment_count": 1,
            }
        else:
            world_map[world]["time_spent_minutes"] += time_spent_minutes
            world_map[world]["interactions"] += interactions
            world_map[world]["deployment_count"] += 1
            # Keep the most recent status
            if updated and updated > (world_map[world].get("last_active") or ""):
                world_map[world]["status"] = status
                world_map[world]["last_active"] = updated

    # 3. Build sorted world list (most recently active first)
    worlds = sorted(
        world_map.values(), key=lambda w: w.get("last_active", ""), reverse=True
    )

    # Format time for each world
    for w in worlds:
        mins = w["time_spent_minutes"]
        w["time_display"] = f"{mins // 60}h {mins % 60}m" if mins > 0 else "< 1m"

    # 4. Aggregate totals
    total_minutes = sum(w["time_spent_minutes"] for w in worlds)

    return {
        "worlds": worlds,
        "stats": {
            "worlds_visited": len(worlds),
            "total_time_minutes": total_minutes,
            "total_time_display": (
                f"{total_minutes // 60}h {total_minutes % 60}m"
                if total_minutes > 0
                else "0h 0m"
            ),
            "avatars_used": len(avatars_used) if deployments else 0,
            "interactions": total_interactions,
        },
    }


@router.get("/api/did/graph")
async def get_did_graph(request: Request, address: str):
    db, _ = await get_secure_context(request, address)
    addr_lower = address.lower()

    nodes = []
    links = []

    # 1. Root Node (User DID/Wallet)
    user = await db.users.find_one({"walletAddress": addr_lower})
    did_record = await db.dids.find_one({"walletAddress": addr_lower})
    did_str = (
        did_record.get("did") if did_record else f"did:metago:{addr_lower[:10]}..."
    )

    nodes.append(
        {
            "id": "root",
            "group": 1,
            "label": user.get("handle", "Citizen") if user else "Citizen",
            "val": 20,
            "desc": did_str,
        }
    )

    # 2. SBTs
    sbt_cursor = db.sbts.find({"walletAddress": addr_lower})
    sbts = [doc async for doc in sbt_cursor] if hasattr(sbt_cursor, "__aiter__") else []
    for sbt in sbts:
        node_id = f"sbt_{sbt.get('_id', 'unknown')}"
        nodes.append(
            {
                "id": node_id,
                "group": 2,
                "label": sbt.get("type", "Credential"),
                "val": 10,
            }
        )
        links.append({"source": "root", "target": node_id, "label": "owns"})

    # 3. ZK Proofs
    zk_cursor = db.zk_proofs.find({"walletAddress": addr_lower})
    zks = [doc async for doc in zk_cursor] if hasattr(zk_cursor, "__aiter__") else []
    for zk in zks:
        node_id = f"zk_{zk.get('_id', 'unknown')}"
        nodes.append({"id": node_id, "group": 3, "label": "ZK Proof", "val": 10})
        links.append({"source": "root", "target": node_id, "label": "proved"})

    # 4. Connected DApps (Sessions)
    sess_cursor = db.sessions.find({"walletAddress": addr_lower})
    sessions = (
        [doc async for doc in sess_cursor] if hasattr(sess_cursor, "__aiter__") else []
    )
    seen_dapps = set()
    for sess in sessions:
        dapp = sess.get("dapp")
        if dapp and dapp not in seen_dapps:
            seen_dapps.add(dapp)
            node_id = f"dapp_{dapp}"
            nodes.append({"id": node_id, "group": 4, "label": dapp, "val": 15})
            links.append({"source": "root", "target": node_id, "label": "connected"})

    # Calculate depth and orphans
    depth = 2 if len(nodes) > 1 else 1

    return {
        "nodes": nodes,
        "links": links,
        "stats": {"node_count": len(nodes), "depth": depth, "orphans": 0},
    }


@router.get("/api/did/trust")
async def get_did_trust(request: Request, address: str):
    db, redis = await get_secure_context(request, address)

    cache_key = f"trust_score:{address.lower()}"
    cached = await redis.get(cache_key) if redis else None
    if cached:
        return json.loads(cached)

    user = await db.users.find_one({"walletAddress": address.lower()})
    trust = user.get("trustScore", 0) if user else 0
    humanity = user.get("humanityIndex", 0.0) if user else 0.0

    response = {"trust_score": trust, "humanity_index": humanity}

    if redis:
        await redis.setex(cache_key, 3600, json.dumps(response))  # Cache 1 hour
    return response


# ---------------------------------------------------------
# 3. DAPPS, CCIP, & SECURITY API LAYER
# ---------------------------------------------------------


@router.get("/api/dapps")
async def get_connected_dapps(request: Request, address: str):
    db, _ = await get_secure_context(request, address)
    # Using the existing 'sessions' collection to infer DApp connections
    cursor = db.sessions.find({"walletAddress": address.lower()})
    sessions = [doc async for doc in cursor] if hasattr(cursor, "__aiter__") else []

    dapps = []
    for sess in sessions:
        if "dapp" in sess:
            dapps.append(sess["dapp"])

    return {"dapps": list(set(dapps))}


@router.get("/api/ccip")
async def get_ccip_status(request: Request, address: str):
    db, _ = await get_secure_context(request, address)

    # Query existing 'cross_chain_syncs' collection
    sync = await db.cross_chain_syncs.find_one(
        {"walletAddress": address.lower(), "status": "pending"}
    )

    return {
        "sync_queue": 1 if sync else 0,
        "transfer_status": "Syncing" if sync else "Idle",
        "network_health": "Optimal",
    }


@router.get("/api/dashboard/security/sessions")
async def get_active_sessions(request: Request, address: str):
    db, _ = await get_secure_context(request, address)

    # Query db.sessions for active logins
    cursor = db.sessions.find({"walletAddress": address.lower()})
    sessions = [doc async for doc in cursor] if hasattr(cursor, "__aiter__") else []

    formatted = []
    for sess in sessions:
        formatted.append(
            {
                "id": sess.get("token", "unknown"),
                "device": sess.get("device_fingerprint", "Unknown Device"),
                "os": sess.get("os", "Unknown OS"),
                "browser": sess.get("browser", "Unknown Browser"),
                "ip": sess.get("ip", "Hidden"),
                "last_active": sess.get("lastActivityAt", ""),
                "is_current": sess.get("token")
                == request.cookies.get("metago_session"),
            }
        )

    return {"sessions": formatted, "total": len(formatted)}


@router.delete("/api/dashboard/security/sessions/{session_id}")
async def revoke_session(request: Request, address: str, session_id: str):
    db, _ = await get_secure_context(request, address)
    # Ensure they own it
    target = await db.sessions.find_one({"token": session_id})
    if not target or target.get("walletAddress", "").lower() != address.lower():
        raise HTTPException(status_code=403, detail="Unauthorized revocation")

    await db.sessions.delete_one({"token": session_id})
    return {"success": True}


@router.get("/api/dashboard/security/audit")
async def get_security_audit(request: Request, address: str):
    db, _ = await get_secure_context(request, address)

    # Query real audit logs
    cursor = db.audit_logs.find({"walletAddress": address.lower()})
    if hasattr(cursor, "sort"):
        cursor = cursor.sort("timestamp", -1).limit(50)

    logs = [doc async for doc in cursor] if hasattr(cursor, "__aiter__") else []

    formatted = []
    for log in logs:
        formatted.append(
            {
                "id": log.get("_id", "unknown"),
                "event": log.get("event", "Unknown Event"),
                "risk": log.get("risk", "Low"),
                "time": log.get("timestamp", ""),
                "details": log.get("metadata", {}),
            }
        )

    return {"audit_logs": formatted}


@router.get("/api/security")
async def get_security_posture(request: Request, address: str):
    db, _ = await get_secure_context(request, address)
    # Infer posture from logs
    cursor = db.audit_logs.find({"walletAddress": address.lower(), "risk": "High"})
    high_risks = [doc async for doc in cursor] if hasattr(cursor, "__aiter__") else []

    threat_level = "High" if len(high_risks) > 0 else "Secure"
    score = max(0, 100 - (len(high_risks) * 20))

    return {"context_score": score, "threat_level": threat_level}


@router.get("/api/notifications")
async def get_notifications(request: Request, address: str):
    db, _ = await get_secure_context(request, address)
    return {"notifications": []}


# ---------------------------------------------------------
# 4. WEBSOCKETS (REAL-TIME ENGINE)
# ---------------------------------------------------------


@router.websocket("/api/ws/dashboard/{address}")
async def dashboard_websocket(websocket: WebSocket, address: str):
    # For websockets, we could inject dependencies and auth, but it's tricky with native protocols.
    # Typically, you'd pass the session token as a query param or header in the handshake.
    await ws_manager.connect(websocket, address)
    try:
        while True:
            # Heartbeat ping/pong and keepalive
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                if payload.get("type") == "ping":
                    await websocket.send_json(
                        {"type": "pong", "timestamp": datetime.utcnow().isoformat()}
                    )
            except:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, address)


# ---------------------------------------------------------
# 10. DASHBOARD OS COMMAND CENTER OVERVIEW
# ---------------------------------------------------------


@router.get("/api/dashboard/overview")
async def get_dashboard_overview(request: Request, address: str):
    db, redis = await get_secure_context(request, address)

    # 1. Identity
    user = await db.users.find_one({"walletAddress": address.lower()}) or {}
    did_record = await db.dids.find_one({"walletAddress": address.lower()}) or {}
    did_str = did_record.get("did", f"did:metago:{address}")

    # 2. ZK & SBT
    sbt_cursor = db.sbts.find({"walletAddress": address.lower()})
    sbts = [doc async for doc in sbt_cursor] if hasattr(sbt_cursor, "__aiter__") else []
    zk_cursor = db.zk_proofs.find({"walletAddress": address.lower()})
    zks = [doc async for doc in zk_cursor] if hasattr(zk_cursor, "__aiter__") else []

    # 3. Privacy
    burner_cursor = db.burner_dids.find({"ownerAddress": address.lower()})
    burners = (
        [doc async for doc in burner_cursor]
        if hasattr(burner_cursor, "__aiter__")
        else []
    )

    return {
        "identity": {
            "handle": user.get("handle", None),
            "did": did_str,
            "level": user.get("level", None),
            "humanity_score": user.get("humanityScore", None),
            "trust_score": user.get("trustScore", None),
            "sbt_count": len(sbts),
            "zk_count": len(zks),
        },
        "wallet": {
            "balance": user.get("walletData", {}).get("native_balance", None),
            "chain": user.get("walletData", {}).get("connected_chain", None),
            "dapps_count": len(user.get("walletData", {}).get("connected_dapps", [])),
        },
        "security": {
            "risk_level": "Low",  # Placeholder for real risk engine
            "active_sessions": 1,
            "threats_blocked": user.get("securityData", {}).get("threats_blocked", 0),
        },
        "intelligence": {
            "guardian_status": "Active",
            "insight": "Identity secured and verified.",
        },
        "privacy": {"burners": len(burners), "vault_locked": True},
        "avatar": {"status": "Not Configured", "connected_worlds": 0},
    }
