# MetaGo Protocol Versioning

The MetaGo Universal Protocol relies on strict backward compatibility to ensure that massive metaverse engines, external web applications, and autonomous agents can reliably communicate without runtime failures.

## Standard Release Versioning

MetaGo follows standard semantic versioning (`MAJOR.MINOR.PATCH`).

Currently, the protocol is locked at:
**v1.0**

## Envelope Requirement

Every message sent across the MetaGo Transport Layer MUST include the protocol version in its root payload envelope. This allows the backend `ConnectorManager` to gracefully handle deprecated SDK versions or reject fundamentally incompatible structures.

### Example v1.0 Envelope

```json
{
  "version": "1.0",
  "event": "Presence.Active",
  "timestamp": 1719000000.0,
  "payload": {
      "user_id": "did:metago:0x8624c5...",
      "position": [0, 1.5, 0]
  }
}
```

### Server Rejection
If a client sends an incompatible major version (e.g., `"version": "2.0"` while the server expects `1.X`), the server will immediately drop the WebSocket connection with a `ProtocolVersionMismatch` error code.
