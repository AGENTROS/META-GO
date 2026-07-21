import asyncio
from metago.client import MetaGo

async def main():
    print("====================================")
    print(" MetaGo Python SDK : Event Listener")
    print("====================================")
    
    # 1. Initialize the SDK
    sdk = MetaGo("ws://localhost:8000/api/v1/connectors/python/stream")
    
    print("[1/3] Connecting to Transport Layer...")
    await sdk.connect()
    
    print("[2/3] Authenticating...")
    # Using the mock token defined in the backend reference implementation
    success = await sdk.authenticate("mock_valid_token")
    
    if not success:
        print("[!] Authentication Failed. Exiting.")
        await sdk.disconnect()
        return
        
    print("[3/3] Authenticated successfully!")
    
    # Define a simple callback
    def on_presence_update(event_envelope):
        payload = event_envelope.get("payload", {})
        print(f"\n[EVENT] -> Remote Avatar Moved!")
        print(f"          Position: {payload.get('position')}")
        
    # Hook into the Global Event Bus
    sdk.subscribe("Presence.Active", on_presence_update)
    print("\nListening for network events... (Press Ctrl+C to exit)\n")
    
    try:
        # Keep the script alive while the background listener task runs
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down SDK...")
    finally:
        await sdk.disconnect()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
