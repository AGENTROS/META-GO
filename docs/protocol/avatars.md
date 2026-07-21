# MetaGo Avatar Protocol

Avatars represent the visual manifestation of a DID in a 3D metaverse engine.

## Supported Formats
Currently, the official standard format enforced across the protocol is **VRM** (Virtual Reality Modeling Language).

## Payload Envelope
When a user switches their avatar model in the MetaGo Dashboard, the backend fires the `Avatar.Updated` event across the Global Event Bus.

```json
{
    "user_id": "did:metago:0x8624c5...",
    "vrm_uri": "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
}
```
All SDKs (Unity, Unreal) are responsible for downloading this decentralized IPFS payload and compiling it into their native render pipelines at runtime.
