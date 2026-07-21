# MetaGo Universal Identity

Identity in MetaGo is absolute and sovereign, defined by a Decentralized Identifier (DID).

## DID Format

MetaGo utilizes a custom DID method rooted in cryptographic keypairs: `did:metago:<wallet_address>`

Example: `did:metago:0x8624c5b2F...`

## Identity State

The identity state binds a sovereign user to their avatars and verified credentials. When a client boots up, the Transport Layer syncs the identity payload to ensure local game clients know who they are rendering.

```json
{
    "did": "did:metago:0x8624c5...",
    "handle": "@cyberpunk_zero",
    "active_avatar": "ipfs://Qm..."
}
```
