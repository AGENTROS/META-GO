import os
import asyncio
from PIL import Image, ImageDraw, ImageFont
import io

# Import the pipeline to test it!
from credential_engine.services.ocr_pipeline import run_ocr_pipeline

def create_dummy_aadhaar() -> bytes:
    """
    Generates a synthetic Aadhaar card image in-memory for testing purposes.
    """
    img = Image.new('RGB', (800, 500), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    
    # Draw some fake Aadhaar content
    # In a real environment, we'd use a truetype font, but default is fine for a basic test
    try:
        font = ImageFont.truetype("arial.ttf", 32)
    except Exception:
        font = ImageFont.load_default()
        
    d.text((50, 50), "GOVERNMENT OF INDIA", fill=(0,0,0), font=font)
    d.text((50, 150), "NAME: RAHUL SHARMA", fill=(0,0,0), font=font)
    d.text((50, 220), "DOB: 12/08/1999", fill=(0,0,0), font=font)
    d.text((50, 350), "1234 5678 1234", fill=(0,0,0), font=font)
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    return img_byte_arr.getvalue()

async def main():
    print("========================================")
    print("🚀 STARTING REAL OCR VALIDATION SCRIPT 🚀")
    print("========================================")
    
    # 1. Generate Image
    print("\n[1] Generating synthetic Aadhaar image in RAM...")
    image_bytes = create_dummy_aadhaar()
    print(f"    -> Image created. Size: {len(image_bytes)/1024:.2f} KB")
    
    # 2. Run OCR Pipeline (Memory Safe)
    print("\n[2] Executing OpenCV Enhancement and EasyOCR Pipeline...")
    print("    (This will read the image directly from RAM and then destroy the buffer)")
    
    try:
        result = run_ocr_pipeline(image_bytes, "Aadhaar")
        print("\n✅ OCR EXTRACTION SUCCESSFUL!\n")
        
        # 3. Print Results in the requested format
        print("--- EXTRACTED FIELDS ---")
        for key, field in result.fields.items():
            print(f"{key.capitalize()}:")
            print(f"{field.value}")
            print("Confidence:")
            print(f"{field.confidence:.2f}\n")
            
        print("------------------------")
        print(f"Overall Engine Confidence: {result.overall_confidence:.2f}")
        
    except Exception as e:
        print(f"\n❌ OCR PIPELINE FAILED: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
