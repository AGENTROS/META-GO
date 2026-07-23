from abc import ABC, abstractmethod
from typing import Dict, Any, List
from credential_engine.models.credential import OCRResult


class BaseOCRProvider(ABC):
    @abstractmethod
    def extract_fields(
        self, raw_text: List[str], confidence_scores: List[float]
    ) -> OCRResult:
        """
        Parses raw text fragments extracted by EasyOCR into structured fields based on document type templates.
        """
        pass
