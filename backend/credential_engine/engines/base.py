from abc import ABC, abstractmethod
from typing import List, Tuple
import numpy as np


class BaseOCREngine(ABC):
    """
    Abstract interface for all OCR extraction engines (EasyOCR, Tesseract, Azure, etc.)
    Ensures MetaGo remains vendor-agnostic.
    """

    @abstractmethod
    def extract_text(self, image_matrix: np.ndarray) -> Tuple[List[str], List[float]]:
        """
        Takes a processed OpenCV image matrix and returns a tuple:
        (List of extracted text fragments, List of confidence scores [0.0 - 1.0])
        """
        pass
