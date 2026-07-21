# MetaGo Authentication Protocol

The Authentication sequence is the primary gateway into the MetaGo Network. It enforces identity validation before a persistent WebSocket session is granted.

## The Handshake Lifecycle

1. **Connect**: The client opens a WebSocket connection to the Transport Layer.
2. **Challenge**: The connection remains in a pending `UNAUTHENTICATED` state. If the client does not authenticate within 5,000ms, the server drops the socket.
3. **Request**: The client transmits an `Auth.Request` event containing an identity token (JWT or Zero-Knowledge Proof).
4. **Validation**: The MetaGo Guardian validates the token signature against the Universal Identity Registry.
5. **Success/Failure**: The server replies with `Auth.Success` (upgrading the socket to `AUTHENTICATED`) or `Auth.Failed` (immediately dropping the socket).

## Auth.Request Payload

```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Auth.Success Payload

```json
{
    "status": "authenticated",
    "did": "did:metago:0x8624c5..."
}
```
