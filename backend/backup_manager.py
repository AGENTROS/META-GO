import os
import json
import secrets
import logging
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger("backup_manager")
logging.basicConfig(level=logging.INFO)

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "metago"
RESTORE_DB_NAME = "metago_restore_test"


class BackupManager:
    def __init__(self, key: bytes = None):
        # AES-256 requires 32 bytes key
        self.key = key or AESGCM.generate_key(bit_length=256)
        self.aesgcm = AESGCM(self.key)

    async def create_backup(self, filepath: str) -> bool:
        """Reads database records, serializes, and encrypts them using AES-256-GCM."""
        logger.info(f"Connecting to MongoDB at {MONGO_URL}")
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]

        collections = [
            "users",
            "sessions",
            "zk_proofs",
            "sbts",
            "used_nullifiers",
            "cross_chain_syncs",
        ]
        backup_data = {}

        for col_name in collections:
            cursor = db[col_name].find()
            docs = []
            async for doc in cursor:
                # Convert ObjectId to string for JSON serialization
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
                docs.append(doc)
            backup_data[col_name] = docs
            logger.info(f"Exported {len(docs)} documents from {col_name}")

        raw_bytes = json.dumps(backup_data).encode("utf-8")

        # AES-GCM 12-byte nonce
        nonce = secrets.token_bytes(12)
        encrypted_data = self.aesgcm.encrypt(nonce, raw_bytes, None)

        # Save file: nonce (12 bytes) + ciphertext (includes auth tag)
        payload = nonce + encrypted_data
        with open(filepath, "wb") as f:
            f.write(payload)

        logger.info(
            f"Backup successfully written to {filepath} ({len(payload)} bytes)."
        )
        client.close()
        return True

    async def verify_and_restore_backup(self, filepath: str) -> bool:
        """Decrypts backup file (verifying integrity tag) and restores it to temporary DB for index/record validation."""
        if not os.path.exists(filepath):
            logger.error("Backup file does not exist.")
            return False

        with open(filepath, "rb") as f:
            payload = f.read()

        if len(payload) < 12:
            logger.error("Invalid backup file format.")
            return False

        nonce = payload[:12]
        ciphertext = payload[12:]

        try:
            decrypted_bytes = self.aesgcm.decrypt(nonce, ciphertext, None)
            backup_data = json.loads(decrypted_bytes.decode("utf-8"))
            logger.info(
                "✓ AES-256-GCM Decryption and Checksum integrity validation PASSED."
            )
        except Exception as e:
            logger.error(
                f"Integrity check failed: AES-256-GCM authentication/decryption error: {e}"
            )
            return False

        # Restore to temp validation database
        client = AsyncIOMotorClient(MONGO_URL)
        # Drop previous restore test database
        await client.drop_database(RESTORE_DB_NAME)
        restore_db = client[RESTORE_DB_NAME]

        logger.info(f"Restoring backup data to test database: {RESTORE_DB_NAME}")

        for col_name, docs in backup_data.items():
            if docs:
                await restore_db[col_name].insert_many(docs)
            logger.info(f"✓ Restored {len(docs)} records to {col_name}")

        # Index verification
        logger.info("Verifying and rebuilding unique indexes...")
        try:
            await restore_db.users.create_index("walletAddress", unique=True)
            await restore_db.sessions.create_index("token", unique=True)
            logger.info(
                "✓ Unique index constraints verified successfully on restored database."
            )
        except Exception as e:
            logger.error(f"Index validation failed on restored database: {e}")
            client.close()
            return False

        # Record count validation
        users_count = await restore_db.users.count_documents({})
        logger.info(
            f"✓ Restore Drill Verification completed. Recovered {users_count} users successfully."
        )

        client.close()
        return True
