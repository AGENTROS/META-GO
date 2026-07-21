# MetaGo Domain Event Catalog

This catalog documents the core events published and consumed across the MetaGo microservice engines.

## 1. Identity Core Events

### `User.Created`
- **Producer:** Identity Engine
- **Consumers:** AI Guardian, Avatar Engine, Biometric Engine, Trust Engine
- **Payload Schema:**
  ```json
  {
    "version": "v1",
    "did": "did:metago:123...",
    "timestamp": "ISO-8601"
  }
  ```

### `User.Updated`
- **Producer:** Identity Engine
- **Consumers:** AI Guardian, Reputation Engine
- **Payload Schema:**
  ```json
  {
    "version": "v1",
    "did": "did:metago:123...",
    "timestamp": "ISO-8601"
  }
  ```

### `Graph.WalletLinked`
- **Producer:** Identity Graph Engine
- **Consumers:** Trust Engine, AI Guardian
- **Payload Schema:**
  ```json
  {
    "version": "v1",
    "did": "did:metago:123...",
    "wallet_address": "0xABC...",
    "chain": "ethereum"
  }
  ```

## 2. Biometrics & Security Events

### `Liveness.Passed`
- **Producer:** Biometric Engine
- **Consumers:** Trust Engine
- **Payload Schema:**
  ```json
  {
    "version": "v1",
    "did": "did:metago:123...",
    "confidence": 98.5
  }
  ```

### `ZK.CommitmentCreated`
- **Producer:** Biometric Engine / ZK Engine
- **Consumers:** Passport Engine
- **Payload Schema:**
  ```json
  {
    "version": "v1",
    "did": "did:metago:123...",
    "commitment": "hash_string"
  }
  ```

### `Consent.Granted`
- **Producer:** Consent Engine
- **Consumers:** AI Guardian
- **Payload Schema:**
  ```json
  {
    "version": "v1",
    "consent_id": "uuid",
    "did": "did:metago:123...",
    "platform": "roblox"
  }
  ```

### `Consent.Revoked`
- **Producer:** Consent Engine
- **Consumers:** AI Guardian
- **Payload Schema:**
  ```json
  {
    "version": "v1",
    "consent_id": "uuid",
    "did": "did:metago:123..."
  }
  ```

## 3. Trust & AI Events

### `Trust.Updated`
- **Producer:** Trust Engine
- **Consumers:** AI Guardian, Passport Engine
- **Payload Schema:**
  ```json
  {
    "version": "v1",
    "did": "did:metago:123...",
    "composite_score": 85.5,
    "timestamp": "ISO-8601"
  }
  ```

## 4. Avatar Events

### `Avatar.Created`
- **Producer:** Avatar Engine
- **Consumers:** Passport Engine, AI Guardian
- **Payload Schema:**
  ```json
  {
    "version": "v1",
    "avatar_id": "uuid",
    "did": "did:metago:123...",
    "provider": "ready_player_me"
  }
  ```

### `Avatar.Imported`
- **Producer:** Avatar Engine
- **Consumers:** Passport Engine
- **Payload Schema:**
  ```json
  {
    "version": "v1",
    "avatar_id": "uuid",
    "did": "did:metago:123...",
    "asset_url": "https://..."
  }
  ```

### `Avatar.Deleted`
- **Producer:** Avatar Engine
- **Consumers:** Passport Engine
- **Payload Schema:**
  ```json
  {
    "version": "v1",
    "avatar_id": "uuid",
    "did": "did:metago:123..."
  }
  ```
