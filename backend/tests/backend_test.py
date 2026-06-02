"""
Backend regression tests for Meta Go IDaaS BFF.
Covers: health, SIWE auth, user sync, ZK verify, relay, credentials, DID resolver,
cross-chain attestations, billing, SBTs.
"""
import os
import time
import json
import secrets
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback for fresh shell — env from frontend/.env
    env_path = os.path.abspath(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "frontend",
            ".env",
        )
    )
    if not os.path.exists(env_path):
        env_path = os.path.abspath(
            os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                "frontend",
                ".env.local",
            )
        )
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Health ----------
class TestHealth:
    def test_health_ok(self, session):
        r = session.get(f"{API}/health", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["db"] == "connected"


# ---------- SIWE auth ----------
class TestAuth:
    def test_nonce_returns_hex_and_cookie(self, session):
        r = session.get(f"{API}/auth/nonce", timeout=15)
        assert r.status_code == 200
        n = r.json()["nonce"]
        assert len(n) == 32
        int(n, 16)  # valid hex
        # cookie set
        assert "metago_nonce" in r.cookies or any("metago_nonce" in c for c in r.headers.get("set-cookie", ""))

    def test_verify_malformed_returns_400(self, session):
        r = session.post(f"{API}/auth/verify", json={"message": "", "signature": ""}, timeout=15)
        assert r.status_code in (400, 401)

    def test_verify_short_signature_returns_400(self, session):
        r = session.post(f"{API}/auth/verify",
                         json={"message": "hello 0x1234567890abcdef1234567890abcdef12345678",
                               "signature": "0xabc"}, timeout=15)
        assert r.status_code in (400, 401)

    def test_verify_with_fallback_address(self, session):
        # Use the fallback path (siwe-py will fail, message contains an address)
        addr = "0x" + "ab" * 20
        msg = f"example.com wants you to sign in\n{addr}\nNonce: 1234567890"
        sig = "0x" + "1" * 130
        r = session.post(f"{API}/auth/verify", json={"message": msg, "signature": sig}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["address"] == addr.lower()


# ---------- User sync ----------
class TestUserSync:
    def test_sync_upserts_user(self, session):
        addr = "0x" + secrets.token_hex(20)
        body = {"handle": "TEST_alice", "email": "alice@test.com",
                "walletAddress": addr, "did": f"did:metago:{addr}"}
        r = session.post(f"{API}/user/sync", json=body, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["did"] == body["did"]

    def test_sync_without_wallet_400(self, session):
        r = session.post(f"{API}/user/sync", json={"handle": "x"}, timeout=15)
        assert r.status_code == 400


# ---------- ZK verify-proof ----------
class TestZK:
    def test_verify_valid_groth16(self, session):
        body = {
            "proof": {"protocol": "groth16",
                      "pi_a": ["1", "2"], "pi_b": [["1", "2"], ["3", "4"]], "pi_c": ["1", "2"]},
            "publicSignals": ["1", "2", "3"],
        }
        r = session.post(f"{API}/verify-proof", json=body, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is True
        assert d["mode"] == "simulation"

    def test_verify_malformed_proof(self, session):
        body = {"proof": {"foo": "bar"}, "publicSignals": []}
        r = session.post(f"{API}/verify-proof", json=body, timeout=15)
        assert r.status_code == 200
        assert r.json()["valid"] is False


# ---------- Relay ----------
class TestRelay:
    def test_relay_rate_limit_and_duplicate_nullifier(self, session):
        session.post(f"{API}/test/reset-rate-limits", timeout=5)
        addr = "0x" + secrets.token_hex(20)
        nullifier_a = "null_" + secrets.token_hex(8)

        # First insert ok
        r = session.post(f"{API}/relay",
                         json={"walletAddress": addr, "nullifier": nullifier_a}, timeout=15)
        assert r.status_code == 200

        # Duplicate nullifier => 409
        r2 = session.post(f"{API}/relay",
                          json={"walletAddress": addr, "nullifier": nullifier_a}, timeout=15)
        assert r2.status_code == 409

        # Burn through rate limit (already used 2 calls). 5 total per minute.
        statuses = []
        for _ in range(6):
            rr = session.post(f"{API}/relay",
                              json={"walletAddress": addr, "nullifier": "n_" + secrets.token_hex(8)},
                              timeout=15)
            statuses.append(rr.status_code)
        # At least one should be 429
        assert 429 in statuses, f"Expected rate-limit 429 in {statuses}"


# ---------- Credentials ----------
class TestCredentials:
    def test_verify_well_formed_vc(self, session):
        vc = {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            "type": ["VerifiableCredential"],
            "credentialSubject": {"id": "did:metago:0xabc"},
        }
        r = session.post(f"{API}/credentials/verify",
                         json={"vcJson": json.dumps(vc)}, timeout=15)
        assert r.status_code == 200
        assert r.json()["valid"] is True

    def test_verify_invalid_json(self, session):
        r = session.post(f"{API}/credentials/verify", json={"vcJson": "not json"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["valid"] is False


# ---------- DID resolver ----------
class TestDID:
    def test_methods_lists_5(self, session):
        r = session.get(f"{API}/did/methods", timeout=15)
        assert r.status_code == 200
        d = r.json()
        methods = d["supportedMethods"]
        assert len(methods) == 5
        for m in ("metago", "ethr", "pkh"):
            assert m in methods

    def test_resolve_metago_did(self, session):
        addr = "0x" + "ab" * 20
        did = f"did:metago:{addr}"
        r = session.get(f"{API}/did/resolve/{did}", timeout=15)
        assert r.status_code == 200
        d = r.json()
        doc = d["didDocument"]
        assert doc["id"] == did
        assert "https://www.w3.org/ns/did/v1" in doc["@context"]
        assert doc["verificationMethod"][0]["type"] == "EcdsaSecp256k1RecoveryMethod2020"

    def test_resolve_did_with_avatar(self, session):
        import secrets
        addr = "0x" + secrets.token_hex(20)
        did = f"did:metago:{addr}"
        avatar_uri = "ipfs://QmAvatarFile12345678901234567890"
        
        # 1. Sync user with avatarUri
        sync_body = {
            "handle": "avatar_bob",
            "walletAddress": addr,
            "did": did,
            "avatarUri": avatar_uri
        }
        sync_r = session.post(f"{API}/user/sync", json=sync_body, timeout=15)
        assert sync_r.status_code == 200
        
        # 2. Resolve DID
        r = session.get(f"{API}/did/resolve/{did}", timeout=15)
        assert r.status_code == 200
        d = r.json()
        doc = d["didDocument"]
        
        # 3. Assert AvatarBinding service exists
        services = doc.get("service", [])
        avatar_service = next((s for s in services if s["type"] == "AvatarBinding"), None)
        assert avatar_service is not None
        assert avatar_service["serviceEndpoint"] == avatar_uri

    def test_resolve_invalid_did(self, session):
        r = session.get(f"{API}/did/resolve/not-a-did", timeout=15)
        assert r.status_code == 400

    def test_cross_chain_6_chains(self, session):
        addr = "0x" + "cd" * 20
        r = session.get(f"{API}/did/cross-chain/{addr}", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert len(d["chains"]) == 6
        assert d["primaryChain"] == "polygon-amoy"


# ---------- Billing ----------
class TestBilling:
    def test_plans_returns_4(self, session):
        r = session.get(f"{API}/billing/plans", timeout=15)
        assert r.status_code == 200
        plans = r.json()["plans"]
        ids = {p["id"] for p in plans}
        assert ids == {"free", "starter", "pro", "enterprise"}

    def test_checkout_free_activated(self, session):
        addr = "0x" + secrets.token_hex(20)
        r = session.post(f"{API}/billing/checkout",
                         json={"plan": "free", "walletAddress": addr}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["type"] == "activated"
        assert d["plan"] == "free"

    def test_checkout_pro_redirect(self, session):
        r = session.post(f"{API}/billing/checkout",
                         json={"plan": "pro"}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["type"] == "checkout_redirect"
        assert "checkout.stripe.com" in d["checkoutUrl"] or "simulated=true" in d["checkoutUrl"]

    def test_subscription_returns_plan(self, session):
        addr = "0x" + secrets.token_hex(20)
        # First activate free
        session.post(f"{API}/billing/checkout",
                     json={"plan": "free", "walletAddress": addr}, timeout=15)
        r = session.get(f"{API}/billing/subscription/{addr}", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["plan"] == "free"
        assert d["details"]["id"] == "free"


# ---------- SBTs ----------
class TestSBT:
    def test_sbts_empty_returns_array(self, session):
        addr = "0x" + secrets.token_hex(20)
        r = session.get(f"{API}/sbts/{addr}", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "sbts" in d
        assert isinstance(d["sbts"], list)


# ---------- OIDC / SIWE Bridge ----------
class TestOIDC:
    def test_full_oidc_flow(self, session):
        import jwt
        addr = "0x" + secrets.token_hex(20)
        did = f"did:metago:{addr}"
        avatar_uri = "ipfs://QmAvatarOIDC123"

        # 1. Setup user in DB
        sync_body = {
            "handle": "oidc_alice",
            "walletAddress": addr,
            "did": did,
            "avatarUri": avatar_uri
        }
        sync_r = session.post(f"{API}/user/sync", json=sync_body, timeout=15)
        assert sync_r.status_code == 200

        # 2. Authorize
        auth_r = session.get(
            f"{API}/oauth/authorize",
            params={
                "client_id": "test_client",
                "redirect_uri": "https://myapp.com/callback",
                "state": "state123",
                "walletAddress": addr
            },
            timeout=15
        )
        assert auth_r.status_code == 200
        redirect_url = auth_r.json()["redirectUrl"]
        assert "code=" in redirect_url
        assert "state=state123" in redirect_url
        
        # Extract code from query params
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(redirect_url)
        code = parse_qs(parsed.query)["code"][0]

        # 3. Token exchange
        token_body = {
            "client_id": "test_client",
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": "https://myapp.com/callback"
        }
        token_r = session.post(f"{API}/oauth/token", json=token_body, timeout=15)
        assert token_r.status_code == 200
        token_data = token_r.json()
        
        assert "access_token" in token_data
        assert "id_token" in token_data
        
        # 4. Decode OIDC ID Token JWT and verify claims translation
        id_token = token_data["id_token"]
        claims = jwt.decode(id_token, "metago_oauth_secret_key_12345", algorithms=["HS256"], audience="test_client")
        
        assert claims["sub"] == did
        assert claims["handle"] == "oidc_alice"
        assert claims["avatar"] == avatar_uri
        assert claims["wallet_address"] == addr.lower()

        # 5. Get Userinfo using bearer access token
        access_token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        userinfo_r = session.get(f"{API}/oauth/userinfo", headers=headers, timeout=15)
        assert userinfo_r.status_code == 200
        userinfo = userinfo_r.json()
        
        assert userinfo["sub"] == did
        assert userinfo["handle"] == "oidc_alice"
        assert userinfo["avatar"] == avatar_uri
        assert userinfo["wallet_address"] == addr.lower()

    def test_metaverse_websocket_relay_flow(self, session):
        import websockets
        import asyncio
        import secrets
        from urllib.parse import urlparse, parse_qs
        
        addr = "0x" + secrets.token_hex(20)
        did = f"did:metago:{addr}"
        avatar_uri = "ipfs://QmMetaverseTest"
        
        # 1. Setup user in DB
        sync_body = {
            "handle": "metaverse_player",
            "walletAddress": addr,
            "did": did,
            "avatarUri": avatar_uri
        }
        sync_r = session.post(f"{API}/user/sync", json=sync_body, timeout=15)
        assert sync_r.status_code == 200

        # Run async websocket client
        async def client_receive():
            session_id = "test_sess_" + secrets.token_hex(8)
            ws_url = API.replace("http://", "ws://").replace("https://", "wss://") + f"/ws/game/{session_id}"
            
            async with websockets.connect(ws_url) as ws:
                # Start OAuth authorize in session
                auth_r = session.get(
                    f"{API}/oauth/authorize",
                    params={
                        "client_id": "meta_game_test",
                        "redirect_uri": f"{API}/oauth/callback",
                        "state": session_id,
                        "walletAddress": addr
                    },
                    timeout=15
                )
                assert auth_r.status_code == 200
                redirect_url = auth_r.json()["redirectUrl"]
                
                parsed = urlparse(redirect_url)
                code = parse_qs(parsed.query)["code"][0]
                
                # Call callback endpoint on server
                callback_r = session.get(f"{API}/oauth/callback", params={"code": code, "state": session_id}, timeout=15)
                assert callback_r.status_code == 200
                
                # Wait to receive the message over websocket
                response = await asyncio.wait_for(ws.recv(), timeout=5.0)
                data = json.loads(response)
                
                assert data["type"] == "auth_success"
                assert data["user"]["did"] == did
                assert data["user"]["avatar"] == avatar_uri
                assert data["user"]["handle"] == "metaverse_player"
                assert "id_token" in data
                
        asyncio.run(client_receive())

    def test_encrypted_vault_backup_and_restore(self, session):
        addr = "0x" + secrets.token_hex(20)
        vault_data = "encrypted_vault_bytes_or_base64_blob"
        
        # 1. Post backup
        backup_r = session.post(f"{API}/user/vault", json={
            "walletAddress": addr,
            "encryptedVault": vault_data
        }, timeout=15)
        assert backup_r.status_code == 200
        assert "ipfsCid" in backup_r.json()
        
        # 2. Get/Restore backup
        restore_r = session.get(f"{API}/user/vault/{addr}", timeout=15)
        assert restore_r.status_code == 200
        assert restore_r.json()["encryptedVault"] == vault_data

    def test_ai_telemetry_anomaly_and_spoof(self, session):
        addr = "0x" + secrets.token_hex(20)
        
        # 1. Retrieve default clean telemetry
        tel_r = session.get(f"{API}/user/telemetry/{addr}", timeout=15)
        assert tel_r.status_code == 200
        assert tel_r.json()["threatLevel"] == "LOW"
        assert tel_r.json()["aiAdjustedTrustScore"] == 72
        
        # 2. Trigger geo-spoof anomaly
        spoof_r = session.post(f"{API}/user/telemetry/spoof", json={
            "walletAddress": addr,
            "triggerAnomaly": True
        }, timeout=15)
        assert spoof_r.status_code == 200
        
        # 3. Retrieve anomalous telemetry
        tel_r2 = session.get(f"{API}/user/telemetry/{addr}", timeout=15)
        assert tel_r2.status_code == 200
        assert tel_r2.json()["threatLevel"] == "HIGH"
        assert tel_r2.json()["aiAdjustedTrustScore"] == 12

    def test_social_recovery_multisig_consensus(self, session):
        import hashlib
        addr = "0x" + secrets.token_hex(20)
        did = f"did:metago:{addr}"
        
        guardians = [
            "0x" + secrets.token_hex(20),
            "0x" + secrets.token_hex(20),
            "0x" + secrets.token_hex(20)
        ]
        passphrase = "mySecretRecoveryWord"
        passphrase_hash = hashlib.sha256(passphrase.encode()).hexdigest()
        
        # 1. Setup guardians
        setup_r = session.post(f"{API}/recovery/setup", json={
            "walletAddress": addr,
            "guardians": guardians,
            "passphraseHash": passphrase_hash
        }, timeout=15)
        assert setup_r.status_code == 200
        
        # 2. Initiate recovery session from new wallet
        new_wallet = "0x" + secrets.token_hex(20)
        init_r = session.post(f"{API}/recovery/initiate", json={
            "did": did,
            "newWalletAddress": new_wallet,
            "passphrase": passphrase
        }, timeout=15)
        assert init_r.status_code == 200
        sess_id = init_r.json()["sessionId"]
        
        # 3. Approve from Guardian 1 (1/3 approvals) -> should remain pending
        app1_r = session.post(f"{API}/recovery/approve", json={
            "sessionId": sess_id,
            "guardianAddress": guardians[0]
        }, timeout=15)
        assert app1_r.status_code == 200
        assert app1_r.json()["status"] == "pending"
        
        # 4. Check status
        status_r = session.get(f"{API}/recovery/status/{did}", timeout=15)
        assert status_r.status_code == 200
        assert status_r.json()["approvals"] == [guardians[0].lower()]
        
        # 5. Approve from Guardian 2 (2/3 approvals) -> status becomes consensus_reached
        app2_r = session.post(f"{API}/recovery/approve", json={
            "sessionId": sess_id,
            "guardianAddress": guardians[1]
        }, timeout=15)
        assert app2_r.status_code == 200
        assert app2_r.json()["status"] == "consensus_reached"
        
        # 6. Execute migration
        migrate_r = session.post(f"{API}/recovery/migrate", json={"sessionId": sess_id}, timeout=15)
        assert migrate_r.status_code == 200
        assert migrate_r.json()["migrated"] is True

    def test_encryption_key_management_and_did_mail(self, session):
        addr_a = "0x" + secrets.token_hex(20)
        addr_b = "0x" + secrets.token_hex(20)
        
        # 1. Store keys for receiver B
        keypair_b = {
            "walletAddress": addr_b,
            "publicKeyJwk": {"kty": "RSA", "n": "mock_n", "e": "AQAB"},
            "encryptedPrivateKey": "mock_encrypted_private_key"
        }
        res_keys = session.post(f"{API}/user/encryption-keys", json=keypair_b, timeout=15)
        assert res_keys.status_code == 200
        
        # 2. Get keys for B
        res_get_keys = session.get(f"{API}/user/encryption-keys/{addr_b}", timeout=15)
        assert res_get_keys.status_code == 200
        assert res_get_keys.json()["publicKeyJwk"] == keypair_b["publicKeyJwk"]
        assert res_get_keys.json()["encryptedPrivateKey"] == keypair_b["encryptedPrivateKey"]
        
        # 3. Try to get keys for A (which doesn't exist yet) -> should 404
        res_get_keys_a = session.get(f"{API}/user/encryption-keys/{addr_a}", timeout=15)
        assert res_get_keys_a.status_code == 404
        
        # 4. Sender A sends encrypted message to B
        message = {
            "senderAddress": addr_a,
            "receiverAddress": addr_b,
            "ciphertext": "encrypted_message_bytes"
        }
        res_send = session.post(f"{API}/messages", json=message, timeout=15)
        assert res_send.status_code == 200
        assert res_send.json()["ok"] is True
        assert res_send.json()["message"]["senderAddress"] == addr_a.lower()
        
        # 5. Fetch messages for B
        res_get_msg = session.get(f"{API}/messages/{addr_b}", timeout=15)
        assert res_get_msg.status_code == 200
        messages = res_get_msg.json()["messages"]
        assert len(messages) >= 1
        assert messages[0]["ciphertext"] == "encrypted_message_bytes"
        assert messages[0]["senderAddress"] == addr_a.lower()

    def test_multi_chain_registry_sync(self, session):
        addr = "0x" + secrets.token_hex(20)
        
        # 1. Fetch initial status -> all other chains should be 'not_syncing', polygon is 'synced'
        status_r1 = session.get(f"{API}/did/sync-status/{addr}", timeout=15)
        assert status_r1.status_code == 200
        data1 = status_r1.json()
        assert data1["polygon"] == "synced"
        assert data1["arbitrum"] == "not_syncing"
        assert data1["base"] == "not_syncing"
        
        # 2. Trigger sync to Base
        sync_r = session.post(f"{API}/did/sync-chain", json={
            "walletAddress": addr,
            "destinationChain": "base"
        }, timeout=15)
        assert sync_r.status_code == 200
        assert sync_r.json()["status"] == "pending"
        
        # 3. Check status immediately -> Base should be pending
        status_r2 = session.get(f"{API}/did/sync-status/{addr}", timeout=15)
        assert status_r2.status_code == 200
        assert status_r2.json()["base"] == "pending"
        
        # 4. Check status on Arbitrum -> still not_syncing
        assert status_r2.json()["arbitrum"] == "not_syncing"

