from fastapi import HTTPException
from PIL import Image
import io

ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"]
MAX_FILE_SIZE_MB = 10

def validate_image_file(file_bytes: bytes, content_type: str):
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPG, PNG, and PDF allowed.")
        
    if len(file_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum size of {MAX_FILE_SIZE_MB}MB.")
        
    try:
        # Prevent Decompression Bomb (Zip Bomb) attacks via PIL
        Image.MAX_IMAGE_PIXELS = 933120000 
        img = Image.open(io.BytesIO(file_bytes))
        img.verify() # verifies format without decoding the whole image
    except Exception as e:
        raise HTTPException(status_code=400, detail="File is corrupted or not a valid image format.")
