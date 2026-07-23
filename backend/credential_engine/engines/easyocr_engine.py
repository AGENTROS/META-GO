import numpy as np
from typing import List, Tuple
from credential_engine.engines.base import BaseOCREngine
import easyocr


class EasyOCREngine(BaseOCREngine):
    def __init__(self, use_gpu: bool = True):
        try:
            self.reader = easyocr.Reader(["en"], gpu=use_gpu)
        except Exception:
            self.reader = easyocr.Reader(["en"], gpu=False)

    def extract_text(self, image_matrix: np.ndarray) -> Tuple[List[str], List[float]]:
        # detail=1 returns (bounding_box, text, confidence)
        result = self.reader.readtext(image_matrix, detail=1)

        raw_texts = []
        confidences = []

        for bbox, text, prob in result:
            raw_texts.append(text)
            confidences.append(prob)

        return raw_texts, confidences
