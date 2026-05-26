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
    with open("/app/frontend/.env") as f:
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
        assert "checkout.stripe.com" in d["checkoutUrl"]

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
