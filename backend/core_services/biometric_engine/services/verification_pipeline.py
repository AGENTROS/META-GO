from ..interfaces.biometric_provider import BiometricProvider
from core_services.zk_engine.interfaces.zk_provider import ZKProvider
from core_services.event_bus.interfaces import EventBus
from .template import BiometricTemplateModel
import secrets

class VerificationPipeline:
    def __init__(self, provider: BiometricProvider, zk: ZKProvider, event_bus: EventBus):
        self.provider = provider
        self.zk = zk
        self.event_bus = event_bus

    async def execute_registration(self, did: str, raw_payload: bytes, metadata: dict) -> BiometricTemplateModel:
        # 1. Liveness Detection
        is_live, conf = await self.provider.check_liveness(raw_payload, metadata)
        if not is_live:
            raise ValueError("Liveness detection failed.")
        
        await self.event_bus.publish("Liveness.Passed", {"did": did, "confidence": conf})

        # 2. Extraction
        template = await self.provider.extract_template(raw_payload)

        # 3. ZK Commitment
        secret = secrets.token_bytes(32)
        commitment = await self.zk.create_commitment(template, secret)
        
        await self.event_bus.publish("ZK.CommitmentCreated", {"did": did, "commitment": commitment})

        # 4. Cleanup and return safe template
        model = BiometricTemplateModel(
            did=did,
            biometric_type="face",
            encrypted_template=template,
            commitment=commitment,
            metadata=metadata
        )
        return model
