import asyncio
import httpx
import json
from eth_account.messages import encode_defunct
from eth_account import Account
import time

async def test():
    acct = Account.create()
    wallet = acct.address.lower()
    
    async with httpx.AsyncClient() as client:
        # 1. Get nonce
        r1 = await client.get("http://localhost:8001/api/auth/nonce")
        nonce = r1.json()["nonce"]
        
        # 2. Sign message
        msg_str = f"localhost wants you to sign in with your Ethereum account:\n{acct.address}\n\nSign in to Meta Go - Sovereign Identity Protocol (Local Demo)\n\nURI: http://localhost:3000\nVersion: 1\nChain ID: 1\nNonce: {nonce}\nIssued At: 2026-07-21T00:00:00.000Z"
        msg = encode_defunct(text=msg_str)
        sig = acct.sign_message(msg)
        signature = sig.signature.hex()
        
        # 3. Verify
        r2 = await client.post("http://localhost:8001/api/auth/verify", json={"message": msg_str, "signature": signature})
        print("verify:", r2.status_code, r2.text)
        if r2.status_code != 200: return
        jwt_token = r2.json()["token"]
        
        # 4. Challenge
        r3 = await client.get(f"http://localhost:8001/api/user/biometrics/challenge?address={wallet}")
        passphrase = r3.json()["challenge"]
        
        # 5. Verify pipeline
        headers = {"Authorization": f"Bearer {jwt_token}"}
        body = {
            "walletAddress": wallet,
            "image": "data:image/jpeg;base64,dummy",
            "audio": "data:audio/webm;base64,dummy",
            "passphraseChallenge": passphrase
        }
        r4 = await client.post("http://localhost:8001/api/user/biometrics/verify-pipeline", json=body, headers=headers)
        print("pipeline:", r4.status_code, r4.text)

asyncio.run(test())
