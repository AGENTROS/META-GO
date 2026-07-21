# Transport Layer Protocol

The MetaGo Platform Connectors support multiple network protocols, but they all conform to the exact same messaging semantics (as defined in `events.md`).

## WebSocket Transport (Primary)

WebSockets are the primary real-time connection utilized by the Unity and Unreal engine SDKs.

- **Endpoint**: `wss://[domain]/api/v1/connectors/{platform_id}/stream`
- **Direction**: Full Duplex (Bidirectional)
- **Lifecycle**:
  1. Client connects via WSS.
  2. Client MUST send `Auth.Request` as the first packet.
  3. Server replies with `Auth.Success` or drops the socket.
  4. Client subscribes/publishes freely.
  5. Connection persists until `disconnect()` or heartbeat timeout.

## REST Fallback

For highly restrictive web environments or simple one-off microservices (like external webhook consumers), the REST API provides polling functionality.

- **Endpoint**: `POST /api/v1/connectors/rest/sync`
- **Direction**: Unidirectional (Request/Response)
- **Warning**: Due to lack of persistent state, REST clients cannot natively "subscribe" to the global event bus. They must either poll or register a Webhook callback endpoint during authentication.
