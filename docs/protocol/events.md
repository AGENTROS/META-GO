# MetaGo Global Event Specification

The MetaGo Protocol is fundamentally event-driven. All actions, updates, and broadcasts are distributed as `MetaGoEvent` envelopes across the transport layer.

## Envelope Structure

```json
{
  "version": "1.0",
  "event": "<TOPIC_NAME>",
  "timestamp": 1719000000.0,
  "payload": {}
}
```

## Core Topics

### Presence
- **`Presence.Active`**: Fired continuously when a user is actively moving or acting in a space.
- **`Presence.Idle`**: Fired when a user goes AFK but remains connected.
- **`Presence.Offline`**: Fired immediately upon transport disconnection.

### Identity & Credentials
- **`Credential.Uploaded`**: Fired when raw documents are sent to the backend OCR pipeline.
- **`Credential.Verified`**: Fired when OCR extraction succeeds and matches against the AI Guardian heuristics.
- **`Credential.Issued`**: Fired when the final Zero-Knowledge hash is committed to the blockchain/database.

### Avatar
- **`Avatar.Updated`**: Fired when a user changes their rigged avatar model, clothing, or biometrics.

### System Auth
- **`Auth.Request`**: Sent by a connecting client.
- **`Auth.Success`**: Returned by MetaGo upon successful token validation.
- **`Auth.Failed`**: Returned by MetaGo upon failure, followed immediately by connection termination.
