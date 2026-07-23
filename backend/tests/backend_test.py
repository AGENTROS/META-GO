"""
Backend regression tests for Meta Go IDaaS BFF.
Covers: health, SIWE auth, user sync, ZK verify, relay, credentials, DID resolver,
cross-chain attestations, billing, SBTs.
"""

import os
import sys

# Initialize default environment for testing
os.environ["TEST_MODE"] = "1"
os.environ["JWT_SECRET"] = (
    "metago_secure_default_test_jwt_secret_key_32_bytes_long_2026"
)

import time
import json
import secrets
import pytest
import requests

# Ensure backend directory is in path for local module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL", os.environ.get("NEXT_PUBLIC_BACKEND_URL", "")
).rstrip("/")
if not BASE_URL:
    env_path = os.path.abspath(
        os.path.join(
            os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            ),
            "frontend",
            ".env",
        )
    )
    if not os.path.exists(env_path):
        env_path = os.path.abspath(
            os.path.join(
                os.path.dirname(
                    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                ),
                "frontend",
                ".env.local",
            )
        )
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                elif line.startswith("NEXT_PUBLIC_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def authenticate_session(session, addr=None, private_key=None):
    from eth_account.messages import encode_defunct
    from eth_account import Account
    import time
    from siwe import SiweMessage

    if not addr or not private_key:
        acct = Account.create()
        addr = acct.address
        private_key = acct.key.hex()
    else:
        acct = Account.from_key(private_key)

    r = session.get(f"{API}/auth/nonce", timeout=15)
    assert r.status_code == 200
    nonce = r.json()["nonce"]

    # Form standard SIWE message
    siwe_msg = SiweMessage(
        domain="localhost",
        address=addr,
        uri="http://localhost",
        version="1",
        chain_id=1,
        nonce=nonce,
        issued_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    )
    message = siwe_msg.prepare_message()
    signable = encode_defunct(text=message)
    signed = acct.sign_message(signable)
    signature = signed.signature.hex()
    if not signature.startswith("0x"):
        signature = "0x" + signature

    r_verify = session.post(
        f"{API}/auth/verify",
        json={"message": message, "signature": signature},
        timeout=15,
    )
    assert r_verify.status_code == 200
    token = r_verify.json()["token"]

    # Store token in session cookies for convenience, and return auth headers
    session.cookies.set(
        "metago_session",
        r_verify.cookies.get("metago_session")
        or r_verify.json().get("session_token", ""),
    )
    return (
        addr,
        private_key,
        {"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )


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
        assert "metago_nonce" in r.cookies or any(
            "metago_nonce" in c for c in r.headers.get("set-cookie", "")
        )

    def test_verify_malformed_returns_400(self, session):
        r = session.post(
            f"{API}/auth/verify", json={"message": "", "signature": ""}, timeout=15
        )
        assert r.status_code in (400, 401)

    def test_verify_short_signature_returns_400(self, session):
        r = session.post(
            f"{API}/auth/verify",
            json={
                "message": "hello 0x1234567890abcdef1234567890abcdef12345678",
                "signature": "0xabc",
            },
            timeout=15,
        )
        assert r.status_code in (400, 401)

    def test_verify_fails_on_invalid_signature(self, session):
        # SIWE must reject signature mismatch (No bypass)
        from eth_account import Account

        acct = Account.create()
        addr = acct.address

        r_nonce = session.get(f"{API}/auth/nonce", timeout=15)
        assert r_nonce.status_code == 200
        nonce = r_nonce.json()["nonce"]

        from siwe import SiweMessage

        siwe_msg = SiweMessage(
            domain="localhost",
            address=addr,
            uri="http://localhost",
            version="1",
            chain_id=1,
            nonce=nonce,
            issued_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        )
        message = siwe_msg.prepare_message()
        bad_sig = "0x" + "1" * 130

        r = session.post(
            f"{API}/auth/verify",
            json={"message": message, "signature": bad_sig},
            timeout=15,
        )
        assert r.status_code in (400, 401)


# ---------- User sync ----------
class TestUserSync:
    def test_sync_upserts_user(self, session):
        # Create real cryptographic session
        addr, pk, headers = authenticate_session(session)
        body = {
            "handle": f"TEST_alice_{secrets.token_hex(4)}",
            "email": "alice@test.com",
            "walletAddress": addr,
            "did": f"did:metago:{addr}",
        }
        r = session.post(f"{API}/user/sync", json=body, headers=headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["did"] == body["did"]

    def test_sync_without_wallet_400(self, session):
        r = session.post(f"{API}/user/sync", json={"handle": "x"}, timeout=15)
        assert r.status_code == 400

    def test_sync_with_biometric_template(self, session):
        addr, pk, headers = authenticate_session(session)
        template = {"ratio": 0.51, "eyeDistToNoseHeightRatio": 1.23}
        body = {
            "handle": f"TEST_bob_{secrets.token_hex(4)}",
            "email": "bob@test.com",
            "walletAddress": addr,
            "did": f"did:metago:{addr}",
            "biometricTemplate": template,
        }
        r = session.post(f"{API}/user/sync", json=body, headers=headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True

        r_me = session.get(f"{API}/user/me", headers=headers, timeout=15)
        assert r_me.status_code == 200
        user_data = r_me.json()
        assert user_data["authenticated"] is True
        assert "biometricTemplate" in user_data
        assert user_data["biometricTemplate"]["ratio"] == 0.51
        assert user_data["biometricTemplate"]["eyeDistToNoseHeightRatio"] == 1.23


# ---------- ZK verify-proof ----------
class TestZK:
    def test_verify_invalid_groth16_rejected(self, session):
        # Dummy proof must be rejected under real verifier rules
        body = {
            "proof": {
                "protocol": "groth16",
                "pi_a": ["1", "2"],
                "pi_b": [["1", "2"], ["3", "4"]],
                "pi_c": ["1", "2"],
            },
            "publicSignals": ["1", "2", "3"],
        }
        r = session.post(f"{API}/verify-proof", json=body, timeout=15)
        assert r.status_code in (200, 400)
        if r.status_code == 200:
            assert r.json()["valid"] is False

    def test_verify_malformed_proof(self, session):
        body = {"proof": {"foo": "bar"}, "publicSignals": []}
        r = session.post(f"{API}/verify-proof", json=body, timeout=15)
        assert r.status_code in (200, 400)
        if r.status_code == 200:
            assert r.json()["valid"] is False


# ---------- Relay ----------
class TestRelay:
    def test_relay_rate_limit_and_duplicate_nullifier(self, session):
        session.post(f"{API}/test/reset-rate-limits", timeout=5)
        addr = "0x" + secrets.token_hex(20)
        nullifier_a = "null_" + secrets.token_hex(8)

        # First insert ok
        r = session.post(
            f"{API}/relay",
            json={"walletAddress": addr, "nullifier": nullifier_a},
            timeout=15,
        )
        assert r.status_code == 200

        # Duplicate nullifier => 409
        r2 = session.post(
            f"{API}/relay",
            json={"walletAddress": addr, "nullifier": nullifier_a},
            timeout=15,
        )
        assert r2.status_code == 409

        # Burn through rate limit (already used 2 calls). 5 total per minute.
        statuses = []
        for _ in range(6):
            rr = session.post(
                f"{API}/relay",
                json={"walletAddress": addr, "nullifier": "n_" + secrets.token_hex(8)},
                timeout=15,
            )
            statuses.append(rr.status_code)
        assert 429 in statuses


# ---------- Credentials ----------
class TestCredentials:
    def test_verify_well_formed_vc(self, session):
        vc = {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            "type": ["VerifiableCredential"],
            "credentialSubject": {"id": "did:metago:0xabc"},
        }
        r = session.post(
            f"{API}/credentials/verify", json={"vcJson": json.dumps(vc)}, timeout=15
        )
        assert r.status_code == 200
        assert r.json()["valid"] is True

    def test_verify_invalid_json(self, session):
        r = session.post(
            f"{API}/credentials/verify", json={"vcJson": "not json"}, timeout=15
        )
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
        assert (
            doc["verificationMethod"][0]["type"] == "EcdsaSecp256k1RecoveryMethod2020"
        )

    def test_resolve_did_with_avatar(self, session):
        addr, pk, headers = authenticate_session(session)
        did = f"did:metago:{addr}"
        avatar_uri = "ipfs://QmAvatarFile12345678901234567890"

        sync_body = {
            "handle": f"avatar_bob_{secrets.token_hex(4)}",
            "walletAddress": addr,
            "did": did,
            "avatarUri": avatar_uri,
        }
        sync_r = session.post(
            f"{API}/user/sync", json=sync_body, headers=headers, timeout=15
        )
        assert sync_r.status_code == 200

        r = session.get(f"{API}/did/resolve/{did}", timeout=15)
        assert r.status_code == 200
        d = r.json()
        doc = d["didDocument"]

        services = doc.get("service", [])
        avatar_service = next(
            (s for s in services if s["type"] == "AvatarBinding"), None
        )
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
        r = session.post(
            f"{API}/billing/checkout",
            json={"plan": "free", "walletAddress": addr},
            timeout=15,
        )
        assert r.status_code == 200
        d = r.json()
        assert d["type"] == "activated"
        assert d["plan"] == "free"

    def test_checkout_pro_redirect(self, session):
        r = session.post(f"{API}/billing/checkout", json={"plan": "pro"}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["type"] == "checkout_redirect"
        assert (
            "checkout.stripe.com" in d["checkoutUrl"]
            or "simulated=true" in d["checkoutUrl"]
        )

    def test_subscription_returns_plan(self, session):
        addr = "0x" + secrets.token_hex(20)
        session.post(
            f"{API}/billing/checkout",
            json={"plan": "free", "walletAddress": addr},
            timeout=15,
        )
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

        addr, pk, headers = authenticate_session(session)
        did = f"did:metago:{addr}"
        avatar_uri = "ipfs://QmAvatarOIDC123"

        # 1. Setup user in DB
        sync_body = {
            "handle": f"oidc_alice_{secrets.token_hex(4)}",
            "walletAddress": addr,
            "did": did,
            "avatarUri": avatar_uri,
        }
        sync_r = session.post(
            f"{API}/user/sync", json=sync_body, headers=headers, timeout=15
        )
        assert sync_r.status_code == 200

        # 2. Authorize
        auth_r = session.get(
            f"{API}/oauth/authorize",
            params={
                "client_id": "test_client",
                "redirect_uri": "https://myapp.com/callback",
                "state": "state123",
                "walletAddress": addr,
            },
            headers=headers,
            timeout=15,
        )
        assert auth_r.status_code == 200
        redirect_url = auth_r.json()["redirectUrl"]
        assert "code=" in redirect_url
        assert "state=state123" in redirect_url

        from urllib.parse import urlparse, parse_qs

        parsed = urlparse(redirect_url)
        code = parse_qs(parsed.query)["code"][0]

        # 3. Token exchange
        token_body = {
            "client_id": "test_client",
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": "https://myapp.com/callback",
        }
        token_r = session.post(f"{API}/oauth/token", json=token_body, timeout=15)
        assert token_r.status_code == 200
        token_data = token_r.json()

        assert "access_token" in token_data
        assert "id_token" in token_data

        id_token = token_data["id_token"]
        claims = jwt.decode(
            id_token,
            "metago_secure_default_test_jwt_secret_key_32_bytes_long_2026",
            algorithms=["HS256"],
            audience="test_client",
        )

        assert claims["sub"] == did
        assert claims["handle"] == sync_body["handle"]
        assert claims["avatar"] == avatar_uri
        assert claims["wallet_address"] == addr.lower()

        # 5. Get Userinfo using bearer access token
        access_token = token_data["access_token"]
        auth_headers = {"Authorization": f"Bearer {access_token}"}
        userinfo_r = session.get(
            f"{API}/oauth/userinfo", headers=auth_headers, timeout=15
        )
        assert userinfo_r.status_code == 200
        userinfo = userinfo_r.json()

        assert userinfo["sub"] == did
        assert userinfo["handle"] == sync_body["handle"]
        assert userinfo["avatar"] == avatar_uri
        assert userinfo["wallet_address"] == addr.lower()

    def test_metaverse_websocket_relay_flow(self, session):
        import websockets
        import asyncio
        from urllib.parse import urlparse, parse_qs

        addr, pk, headers = authenticate_session(session)
        did = f"did:metago:{addr}"
        avatar_uri = "ipfs://QmMetaverseTest"

        sync_body = {
            "handle": f"metaverse_player_{secrets.token_hex(4)}",
            "walletAddress": addr,
            "did": did,
            "avatarUri": avatar_uri,
        }
        sync_r = session.post(
            f"{API}/user/sync", json=sync_body, headers=headers, timeout=15
        )
        assert sync_r.status_code == 200

        async def client_receive():
            session_id = "test_sess_" + secrets.token_hex(8)
            ws_url = (
                API.replace("http://", "ws://").replace("https://", "wss://")
                + f"/ws/game/{session_id}"
            )

            async with websockets.connect(ws_url) as ws:
                auth_r = session.get(
                    f"{API}/oauth/authorize",
                    params={
                        "client_id": "meta_game_test",
                        "redirect_uri": f"{API}/oauth/callback",
                        "state": session_id,
                        "walletAddress": addr,
                    },
                    headers=headers,
                    timeout=15,
                )
                assert auth_r.status_code == 200
                redirect_url = auth_r.json()["redirectUrl"]

                parsed = urlparse(redirect_url)
                code = parse_qs(parsed.query)["code"][0]

                callback_r = session.get(
                    f"{API}/oauth/callback",
                    params={"code": code, "state": session_id},
                    timeout=15,
                )
                assert callback_r.status_code == 200

                response = await asyncio.wait_for(ws.recv(), timeout=5.0)
                data = json.loads(response)

                assert data["type"] == "auth_success"
                assert data["user"]["did"] == did
                assert data["user"]["avatar"] == avatar_uri
                assert data["user"]["handle"] == sync_body["handle"]
                assert "id_token" in data

        asyncio.run(client_receive())

    def test_encrypted_vault_backup_and_restore(self, session):
        addr, pk, headers = authenticate_session(session)
        vault_data = "encrypted_vault_bytes_or_base64_blob"

        backup_r = session.post(
            f"{API}/user/vault",
            json={"walletAddress": addr, "encryptedVault": vault_data},
            headers=headers,
            timeout=15,
        )
        assert backup_r.status_code == 200
        assert "ipfsCid" in backup_r.json()

        restore_r = session.get(f"{API}/user/vault/{addr}", headers=headers, timeout=15)
        assert restore_r.status_code == 200
        assert restore_r.json()["encryptedVault"] == vault_data

    def test_ai_telemetry_anomaly_and_spoof(self, session):
        addr, pk, headers = authenticate_session(session)

        tel_r = session.get(f"{API}/user/telemetry/{addr}", headers=headers, timeout=15)
        assert tel_r.status_code == 200
        assert tel_r.json()["threatLevel"] == "LOW"
        assert tel_r.json()["aiAdjustedTrustScore"] == 72

        spoof_r = session.post(
            f"{API}/user/telemetry/spoof",
            json={"walletAddress": addr, "triggerAnomaly": True},
            headers=headers,
            timeout=15,
        )
        assert spoof_r.status_code == 200

        tel_r2 = session.get(
            f"{API}/user/telemetry/{addr}", headers=headers, timeout=15
        )
        assert tel_r2.status_code == 200
        assert tel_r2.json()["threatLevel"] == "HIGH"
        assert tel_r2.json()["aiAdjustedTrustScore"] == 12

    def test_social_recovery_multisig_consensus(self, session):
        import hashlib
        from eth_account import Account
        from eth_account.messages import encode_defunct

        addr, pk, headers = authenticate_session(session)
        did = f"did:metago:{addr}"

        guardian_accts = [Account.create() for _ in range(3)]
        guardians = [acct.address for acct in guardian_accts]
        passphrase = "mySecretRecoveryWord"
        passphrase_hash = hashlib.sha256(passphrase.encode()).hexdigest()

        setup_r = session.post(
            f"{API}/recovery/setup",
            json={
                "walletAddress": addr,
                "guardians": guardians,
                "passphraseHash": passphrase_hash,
            },
            headers=headers,
            timeout=15,
        )
        assert setup_r.status_code == 200

        new_wallet = Account.create().address
        init_r = session.post(
            f"{API}/recovery/initiate",
            json={"did": did, "newWalletAddress": new_wallet, "passphrase": passphrase},
            timeout=15,
        )
        assert init_r.status_code == 200
        sess_id = init_r.json()["sessionId"]

        msg_hash = encode_defunct(text=sess_id)
        sig1 = Account.sign_message(msg_hash, guardian_accts[0].key).signature.hex()

        app1_r = session.post(
            f"{API}/recovery/approve",
            json={
                "sessionId": sess_id,
                "guardianAddress": guardians[0],
                "signature": sig1,
            },
            timeout=15,
        )
        assert app1_r.status_code == 200
        assert app1_r.json()["status"] == "pending"

        status_r = session.get(f"{API}/recovery/status/{did}", timeout=15)
        assert status_r.status_code == 200
        assert status_r.json()["approvals"] == [guardians[0].lower()]

        sig2 = Account.sign_message(msg_hash, guardian_accts[1].key).signature.hex()
        app2_r = session.post(
            f"{API}/recovery/approve",
            json={
                "sessionId": sess_id,
                "guardianAddress": guardians[1],
                "signature": sig2,
            },
            timeout=15,
        )
        assert app2_r.status_code == 200
        assert app2_r.json()["status"] == "consensus_reached"

        migrate_r = session.post(
            f"{API}/recovery/migrate", json={"sessionId": sess_id}, timeout=15
        )
        assert migrate_r.status_code == 200
        assert migrate_r.json()["migrated"] is True

    def test_encryption_key_management_and_did_mail(self, session):
        addr_a, pk_a, headers_a = authenticate_session(session)
        addr_b, pk_b, headers_b = authenticate_session(session)

        keypair_b = {
            "walletAddress": addr_b,
            "publicKeyJwk": {"kty": "RSA", "n": "mock_n", "e": "AQAB"},
            "encryptedPrivateKey": "mock_encrypted_private_key",
        }
        res_keys = session.post(
            f"{API}/user/encryption-keys", json=keypair_b, headers=headers_b, timeout=15
        )
        assert res_keys.status_code == 200

        res_get_keys = session.get(
            f"{API}/user/encryption-keys/{addr_b}", headers=headers_b, timeout=15
        )
        assert res_get_keys.status_code == 200
        assert res_get_keys.json()["publicKeyJwk"] == keypair_b["publicKeyJwk"]
        assert (
            res_get_keys.json()["encryptedPrivateKey"]
            == keypair_b["encryptedPrivateKey"]
        )

        res_get_keys_a = session.get(
            f"{API}/user/encryption-keys/{addr_a}", headers=headers_a, timeout=15
        )
        assert res_get_keys_a.status_code == 404

        message = {
            "senderAddress": addr_a,
            "receiverAddress": addr_b,
            "ciphertext": "encrypted_message_bytes",
        }
        res_send = session.post(
            f"{API}/messages", json=message, headers=headers_a, timeout=15
        )
        assert res_send.status_code == 200
        assert res_send.json()["ok"] is True
        assert res_send.json()["message"]["senderAddress"] == addr_a.lower()

        res_get_msg = session.get(
            f"{API}/messages/{addr_b}", headers=headers_b, timeout=15
        )
        assert res_get_msg.status_code == 200
        messages = res_get_msg.json()["messages"]
        assert len(messages) >= 1
        assert messages[0]["ciphertext"] == "encrypted_message_bytes"
        assert messages[0]["senderAddress"] == addr_a.lower()

    def test_multi_chain_registry_sync(self, session):
        addr, pk, headers = authenticate_session(session)

        status_r1 = session.get(f"{API}/did/sync-status/{addr}", timeout=15)
        assert status_r1.status_code == 200
        data1 = status_r1.json()
        assert data1["polygon"] == "synced"
        assert data1["arbitrum"] == "not_syncing"
        assert data1["base"] == "not_syncing"

        sync_r = session.post(
            f"{API}/did/sync-chain",
            json={"walletAddress": addr, "destinationChain": "base"},
            headers=headers,
            timeout=15,
        )
        assert sync_r.status_code == 200
        assert sync_r.json()["status"] == "pending"

        status_r2 = session.get(f"{API}/did/sync-status/{addr}", timeout=15)
        assert status_r2.status_code == 200
        assert status_r2.json()["base"] == "pending"

        assert status_r2.json()["arbitrum"] == "not_syncing"
        time.sleep(6)
        status_r3 = session.get(f"{API}/did/sync-status/{addr}", timeout=15)
        assert status_r3.status_code == 200
        assert status_r3.json()["base"] == "synced"


# ---------- Security Regression Tests ----------
class TestBackendSecurity:
    def test_simulation_proof_rejected_in_production(self):
        orig_test_mode = os.environ.get("TEST_MODE")
        orig_jwt_secret = os.environ.get("JWT_SECRET")
        try:
            os.environ["TEST_MODE"] = "0"
            os.environ["JWT_SECRET"] = (
                "metago_secure_default_test_jwt_secret_key_32_bytes_long_2026"
            )

            from server import verify_proof, VerifyProofBody
            from fastapi import Request, HTTPException
            from unittest.mock import MagicMock
            import asyncio

            req = MagicMock(spec=Request)
            req.client = MagicMock()
            req.client.host = "127.0.0.1"
            req.headers = {}
            req.cookies = {}

            body = VerifyProofBody(
                proof={
                    "protocol": "simulation",
                    "pi_a": ["1", "2"],
                    "pi_b": [["1", "2"], ["3", "4"]],
                    "pi_c": ["1", "2"],
                },
                publicSignals=["123_nullifier", "2"],
            )
            with pytest.raises(HTTPException) as excinfo:
                asyncio.run(verify_proof(body, req))
            assert excinfo.value.status_code == 400
        finally:
            if orig_test_mode is not None:
                os.environ["TEST_MODE"] = orig_test_mode
            if orig_jwt_secret is not None:
                os.environ["JWT_SECRET"] = orig_jwt_secret
            else:
                os.environ.pop("JWT_SECRET", None)

    def test_test_mode_startup_violation(self):
        orig_test_mode = os.environ.get("TEST_MODE")
        orig_env = os.environ.get("ENV")
        try:
            os.environ["TEST_MODE"] = "1"
            os.environ["ENV"] = "production"

            with pytest.raises(RuntimeError) as excinfo:
                import importlib
                import relayer

                importlib.reload(relayer)
            assert "CRITICAL SECURITY VIOLATION" in str(excinfo.value)
        finally:
            if orig_test_mode is not None:
                os.environ["TEST_MODE"] = orig_test_mode
            if orig_env is not None:
                os.environ["ENV"] = orig_env
            else:
                os.environ.pop("ENV", None)

    def test_redis_outage_blocks_signing(self):
        from relayer import RedisNonceManager
        import redis

        with pytest.raises(RuntimeError) as excinfo:
            manager = RedisNonceManager(
                host="localhost",
                port=9999,
                w3_pool=None,
                deployer_addr="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                chain_id=1337,
            )
        assert "Redis is unreachable" in str(excinfo.value)

    def test_invalid_groth16_proof_rejected(self):
        from zk_verifier import MockSnarkjsVerifier

        proof = {
            "protocol": "groth16",
            "curve": "bn128",
            "pi_a": ["999999", "888888"],
            "pi_b": [["111", "222"], ["333", "444"]],
            "pi_c": ["555555", "666666"],
        }
        signals = ["1", "2", "3", "4"]
        valid = MockSnarkjsVerifier.verify_proof(proof, signals)
        assert valid is False

    def test_reorg_reconciliation_rollback(self):
        from server import db
        from reconciliation import nightly_reconciliation
        from unittest.mock import MagicMock
        import asyncio

        addr = "0x" + secrets.token_hex(20)
        did = f"did:metago:{addr}"

        async def run_test():
            await db.users.insert_one(
                {"walletAddress": addr, "handle": "reorg_user", "did": did}
            )
            await db.zk_proofs.insert_one({"walletAddress": addr, "proofHash": "dummy"})
            await db.sbts.insert_one({"walletAddress": addr, "status": "VALID"})

            assert await db.users.find_one({"walletAddress": addr}) is not None

            from relayer import relayer, RelayerClient

            orig_available = relayer.available
            orig_w3_prop = RelayerClient.w3
            orig_addresses = relayer.addresses

            try:
                relayer.available = lambda: True
                mock_w3 = MagicMock()
                mock_w3.eth.chain_id = 1337

                mock_contract = MagicMock()
                mock_identities = MagicMock()
                mock_identities.call.return_value = ("", "", b"", 0, False)
                mock_contract.functions.identities.return_value = mock_identities

                mock_balance_of = MagicMock()
                mock_balance_of.call.return_value = 0
                mock_contract.functions.balanceOf.return_value = mock_balance_of

                mock_w3.eth.contract.return_value = mock_contract

                RelayerClient.w3 = property(lambda self: mock_w3)
                relayer.addresses = {
                    "IdentityRegistry": "0x" + "1" * 40,
                    "CelestialSBT": "0x" + "2" * 40,
                }

                orig_sleep = asyncio.sleep

                async def mock_sleep(secs):
                    raise GeneratorExit()

                asyncio.sleep = mock_sleep

                try:
                    await nightly_reconciliation(db)
                except GeneratorExit:
                    pass
                finally:
                    asyncio.sleep = orig_sleep

                assert await db.users.find_one({"walletAddress": addr}) is None
                assert await db.zk_proofs.find_one({"walletAddress": addr}) is None
                assert await db.sbts.find_one({"walletAddress": addr}) is None

            finally:
                relayer.available = orig_available
                RelayerClient.w3 = orig_w3_prop
                relayer.addresses = orig_addresses
                await db.users.delete_many({"walletAddress": addr})
                await db.zk_proofs.delete_many({"walletAddress": addr})
                await db.sbts.delete_many({"walletAddress": addr})

        asyncio.run(run_test())

    def test_duplicate_nullifier_rejection(self, session):
        addr, pk, headers = authenticate_session(session)
        nullifier = "null_" + secrets.token_hex(8)
        body = {
            "handle": f"TEST_dup_null_{secrets.token_hex(4)}",
            "email": "dup_null@test.com",
            "walletAddress": addr,
            "did": f"did:metago:{addr}",
        }
        session.post(f"{API}/test/reset-rate-limits")
        r1 = session.post(f"{API}/user/sync", json=body, headers=headers, timeout=15)
        assert r1.status_code == 200

        # Second sync with same nullifier (different address) -> should fail
        addr2, pk2, headers2 = authenticate_session(session)
        body["walletAddress"] = addr2
        body["did"] = f"did:metago:{addr2}"
        body["handle"] = "TEST_dup_null2"
        session.post(f"{API}/test/reset-rate-limits")
        r2 = session.post(
            f"{API}/relay",
            json={"walletAddress": addr2, "nullifier": nullifier},
            timeout=15,
        )
        # Seed the nullifier usage
        session.post(
            f"{API}/relay",
            json={"walletAddress": addr2, "nullifier": nullifier},
            timeout=15,
        )
        r2_retry = session.post(
            f"{API}/relay",
            json={"walletAddress": addr2, "nullifier": nullifier},
            timeout=15,
        )
        assert r2_retry.status_code == 409

    def test_duplicate_handle_rejection(self, session):
        addr, pk, headers = authenticate_session(session)
        handle = f"TEST_unique_handle_{secrets.token_hex(4)}"
        body = {"handle": handle, "walletAddress": addr, "did": f"did:metago:{addr}"}
        session.post(f"{API}/test/reset-rate-limits")
        r1 = session.post(f"{API}/user/sync", json=body, headers=headers, timeout=15)
        assert r1.status_code == 200

        # Attempt duplicate registration
        addr2, pk2, headers2 = authenticate_session(session)
        body2 = {"handle": handle, "walletAddress": addr2, "did": f"did:metago:{addr2}"}
        session.post(f"{API}/test/reset-rate-limits")
        r2 = session.post(f"{API}/user/sync", json=body2, headers=headers2, timeout=15)
        assert r2.status_code in (400, 409, 502)

    def test_ephemeral_key_generation_path(self):
        orig_test_mode = os.environ.get("TEST_MODE")
        orig_key = os.environ.get("DEPLOYER_KEY")
        try:
            os.environ["TEST_MODE"] = "1"
            os.environ.pop("DEPLOYER_KEY", None)

            import importlib
            import relayer

            importlib.reload(relayer)

            assert relayer.IS_EPHEMERAL is True
            assert len(relayer.DEPLOYER_KEY) in (64, 66)
        finally:
            if orig_test_mode is not None:
                os.environ["TEST_MODE"] = orig_test_mode
            if orig_key is not None:
                os.environ["DEPLOYER_KEY"] = orig_key

    def test_gas_circuit_breaker_activation(self):
        from relayer import relayer

        if relayer.available():

            class FakeTx:
                def build_transaction(self, details):
                    return details

            tx = FakeTx()
            orig_gas_price = relayer.w3.eth.gas_price
            try:
                type(relayer.w3.eth).gas_price = 400_000_000_000
                with pytest.raises(RuntimeError) as excinfo:
                    relayer._estimate_and_check_gas(tx, relayer.deployer_addr)
                assert "Gas price circuit breaker triggered" in str(excinfo.value)
            finally:
                type(relayer.w3.eth).gas_price = orig_gas_price

    def test_test_endpoint_inaccessible_in_production(self):
        orig_test_mode = os.environ.get("TEST_MODE")
        orig_jwt_secret = os.environ.get("JWT_SECRET")
        try:
            os.environ["TEST_MODE"] = "0"
            os.environ["JWT_SECRET"] = (
                "metago_secure_default_test_jwt_secret_key_32_bytes_long_2026"
            )

            from fastapi import Request
            from starlette.datastructures import URL
            from unittest.mock import MagicMock
            import asyncio

            req = MagicMock(spec=Request)
            req.url = URL("http://localhost/api/test/reset-rate-limits")

            from server import gate_test_endpoints

            async def call_next(r):
                return "called"

            res = asyncio.run(gate_test_endpoints(req, call_next))
            assert res.status_code == 404
        finally:
            if orig_test_mode is not None:
                os.environ["TEST_MODE"] = orig_test_mode
            if orig_jwt_secret is not None:
                os.environ["JWT_SECRET"] = orig_jwt_secret
            else:
                os.environ.pop("JWT_SECRET", None)

    def test_backup_restore_drill(self):
        from backup_manager import BackupManager
        import asyncio
        import os
        import secrets

        async def run_test():
            backup_path = f"backup_{secrets.token_hex(4)}.enc"
            manager = BackupManager()

            backup_ok = await manager.create_backup(backup_path)
            assert backup_ok is True

            restore_ok = await manager.verify_and_restore_backup(backup_path)
            assert restore_ok is True

            if os.path.exists(backup_path):
                os.remove(backup_path)

        asyncio.run(run_test())
