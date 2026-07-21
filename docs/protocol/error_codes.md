# MetaGo Standardized Error Codes

When a WebSocket connection forcibly drops or an event is rejected by the Global Event Bus, the server payload will contain a standardized error code mapping.

## Protocol & Schema Errors
- `4000` | `ProtocolVersionMismatch` - SDK is using an incompatible major version (e.g., sending v2.0 to a v1.0 server).
- `4001` | `MalformedPayload` - Event envelope failed JSON Schema validation (e.g., passing a string into an array property).

## Authentication Errors
- `4010` | `InvalidToken` - The Auth token is expired, forged, or blacklisted.
- `4011` | `AuthTimeout` - Client connected but failed to send the `Auth.Request` handshake within the 5,000ms window.
- `4012` | `UnauthorizedTopic` - Client attempted to publish to a protected system topic (like `Credential.Issued`).
