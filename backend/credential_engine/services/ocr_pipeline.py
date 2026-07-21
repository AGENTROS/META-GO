import io
import cv2
import numpy as np
from credential_engine.models.credential import OCRResult
from credential_engine.providers.aadhaar import AadhaarProvider
from credential_engine.engines.easyocr_engine import EasyOCREngine

# Dependency Injection of the OCR Engine (Allows hot-swapping to PaddleOCR/Azure)
# Currently instantiating EasyOCR on startup
active_ocr_engine = EasyOCREngine(use_gpu=True)

def enhance_image_for_ocr(img_array: np.ndarray) -> np.ndarray:
    """
    Applies OpenCV morphological transformations to increase text contrast.
    """
    gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
    
    # Increase contrast
    alpha = 1.5
    beta = 0
    enhanced = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)
    
    # Binarization
    _, thresh = cv2.threshold(enhanced, 128, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    
    return thresh

def run_ocr_pipeline(file_bytes: bytes, doc_type: str = "Aadhaar") -> OCRResult:
    """
    Main memory-safe OCR pipeline using abstracted engines.
    """
    # 1. Load Bytes into OpenCV Matrix
    nparr = np.frombuffer(file_bytes, np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # 2. Image Enhancement
    processed_img = enhance_image_for_ocr(img_cv)
    
    # 3. Engine-Agnostic Extraction
    raw_texts, confidences = active_ocr_engine.extract_text(processed_img)
        
    # 4. Explicit Memory Cleanup
    del img_cv
    del processed_img
    del nparr
    
    # 5. Dynamic Routing to Provider Parsing Logic via Registry
    from credential_engine.providers.registry import CredentialProviderRegistry
    provider = CredentialProviderRegistry.get_provider(doc_type)
    return provider.extract_fields(raw_texts, confidences)
