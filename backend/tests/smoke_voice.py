import os
os.environ['TEST_MODE'] = '1'
import time
import base64
import asyncio
from fastapi.testclient import TestClient

# Ensure project root is importable
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from backend import server

async def setup_session(token, wallet):
    await server.db.sessions.delete_many({})
    await server.db.users.delete_many({})
    await server.db.sessions.insert_one({
        "token": token,
        "walletAddress": wallet,
        "expiresAt": time.time() + 3600
    })
    # insert a user doc for update
    await server.db.users.insert_one({"walletAddress": wallet})


def run_smoke():
    token = "smoketoken123"
    wallet = "0xabcde0000000000000000000000000000000000"
    asyncio.run(setup_session(token, wallet))

    # verify session exists
    sess = asyncio.run(server.db.sessions.find_one({"token": token}))
    print("session in db:", sess)

    client = TestClient(server.app)

    # 1. get challenge
    r = client.get(f"/api/user/biometrics/challenge?count=1&address={wallet}")
    print("challenge status:", r.status_code, r.json())

    # 2. register voice (send small dummy base64 audio)
    dummy_audio = base64.b64encode(b"this is a dummy audio blob for smoke test").decode()
    body = {"walletAddress": wallet, "recordings": [dummy_audio]}
    # Try with Authorization header first
    headers = {"Authorization": f"Bearer {token}"}
    r2 = client.post("/api/user/biometrics/register-voice", json=body, headers=headers)
    if r2.status_code == 401:
        # Fallback: set session cookie and retry
        client.cookies.set("metago_session", token)
        r2 = client.post("/api/user/biometrics/register-voice", json=body)
    print("register status:", r2.status_code, r2.json())


if __name__ == '__main__':
    run_smoke()
