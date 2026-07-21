import re
from typing import List
from credential_engine.providers.base import BaseOCRProvider
from credential_engine.models.credential import OCRResult, ExtractedField

class AadhaarProvider(BaseOCRProvider):
    def extract_fields(self, raw_text: List[str], confidence_scores: List[float]) -> OCRResult:
        fields = {}
        
        # Simple heuristics for Aadhaar extraction
        for idx, text in enumerate(raw_text):
            conf = confidence_scores[idx]
            
            # Match 12-digit Aadhaar number
            if re.search(r'\b\d{4}\s?\d{4}\s?\d{4}\b', text):
                clean_num = re.sub(r'\s+', '', text)
                if len(clean_num) == 12:
                    fields["aadhaar_number"] = ExtractedField(value=clean_num, confidence=conf)
                    
            # Match DOB (e.g. DOB: 01/01/1990 or Year of Birth : 1990)
            elif "DOB" in text.upper() or "YEAR OF BIRTH" in text.upper():
                fields["dob"] = ExtractedField(value=text, confidence=conf)
            
            # Simple assumption: Name is usually uppercase and appears early
            # (In a production system, a more robust NLP NER model is recommended)
            elif len(text) > 4 and text.isupper() and "name" not in fields:
                if not any(char.isdigit() for char in text) and "GOVERNMENT" not in text:
                    fields["name"] = ExtractedField(value=text, confidence=conf)
                    
        overall_conf = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
        
        return OCRResult(
            document_type="Aadhaar",
            fields=fields,
            overall_confidence=overall_conf
        )
