from siwe import SiweMessage
import eth_utils

addr = eth_utils.to_checksum_address("0x8624e6b92a2ac487fa6e0c4f7f6a623f9dd22dd4")

msg = f"""frontend-zeta-ruby-85.vercel.app wants you to sign in with your Ethereum account:
{addr}

Sign in to Meta Go - Sovereign Identity Protocol (Local Demo)

URI: https://frontend-zeta-ruby-85.vercel.app
Version: 1
Chain ID: 137
Nonce: 3daf333983d86cf74ceb338e221260c8
Issued At: 2026-07-21T18:20:50.123Z"""

try:
    sm = SiweMessage.from_message(msg)
    prepared = sm.prepare_message()
    if prepared != msg:
        print("MISMATCH!")
        print("ORIGINAL:")
        print(repr(msg))
        print("PREPARED:")
        print(repr(prepared))
    else:
        print("MATCH!")
except Exception as e:
    print(f"Failed to parse: {repr(e)}")
