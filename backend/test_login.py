import asyncio
import httpx
import json
from eth_account.messages import encode_defunct
from eth_account import Account
import time

async def test():
    acct = Account.create()
    wallet = acct.address
    base_url = "https://frontend-zeta-ruby-85.vercel.app/api/proxy"
    
    async with httpx.AsyncClient() as client:
        print("1. Fetching nonce...")
        r1 = await client.get(f"{base_url}/api/auth/nonce")
        if r1.status_code != 200:
            print("Failed to fetch nonce:", r1.status_code, r1.text)
            return
        nonce = r1.json()["nonce"]
        print("Nonce:", nonce)
        
        # 2. Sign message
        # In useSIWE.ts, domain is window.location.host which is frontend-zeta-ruby-85.vercel.app
        domain = "frontend-zeta-ruby-85.vercel.app"
        uri = f"https://{domain}"
        
        # Issued At: using ISO format with milliseconds
        import datetime
        issued_at = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")
        
        msg_str = f"{domain} wants you to sign in with your Ethereum account:\n{wallet}\n\nSign in to Meta Go - Sovereign Identity Protocol (Local Demo)\n\nURI: {uri}\nVersion: 1\nChain ID: 1\nNonce: {nonce}\nIssued At: {issued_at}"
        print("Message to sign:\n", msg_str)
        
        msg = encode_defunct(text=msg_str)
        sig = acct.sign_message(msg)
        signature = sig.signature.hex()
        
        # 3. Verify
        print("2. Verifying signature...")
        r2 = await client.post(f"{base_url}/api/auth/verify", json={"message": msg_str, "signature": signature})
        print("verify response:", r2.status_code, r2.text)

asyncio.run(test())
