# MetaGo Credentials Protocol

Verifiable Credentials (VCs) in MetaGo are cryptographically signed payloads that prove physical identity (e.g., Aadhaar, Passport) without revealing the underlying Personally Identifiable Information (PII).

## Credential Lifecycle Events

- **`Credential.Uploaded`**: The raw document was accepted by the server.
- **`Credential.Verified`**: The Guardian AI successfully extracted and matched the document.
- **`Credential.Issued`**: The Zero-Knowledge commitment was formally issued to the DID.

## Credential Payload Envelope

When the `Credential.Issued` event is fired, the payload contains:
```json
{
    "document_type": "passport",
    "zk_proof": "0xabc123f889912...",
    "issued_at": 1719000000.0,
    "issuer": "did:metago:guardian"
}
```
