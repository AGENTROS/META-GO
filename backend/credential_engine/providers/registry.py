from typing import Dict, Callable
from credential_engine.providers.base import BaseOCRProvider
from credential_engine.providers.aadhaar import AadhaarProvider

class CredentialProviderRegistry:
    """
    Dynamic registry to resolve the correct parsing strategy based on document type.
    Uses Dependency Injection factories to allow custom initialization per provider.
    """
    
    _registry: Dict[str, Callable[[], BaseOCRProvider]] = {
        "aadhaar": lambda: AadhaarProvider(),
        # "passport": lambda: PassportProvider(config=passport_cfg),
    }

    @classmethod
    def register(cls, document_type: str, provider_factory: Callable[[], BaseOCRProvider]):
        cls._registry[document_type.lower()] = provider_factory

    @classmethod
    def get_provider(cls, document_type: str) -> BaseOCRProvider:
        doc_type_lower = document_type.lower()
        factory = cls._registry.get(doc_type_lower)
        
        if not factory:
            raise ValueError(f"Document type '{document_type}' provider is not implemented yet in the Registry.")
            
        return factory()
