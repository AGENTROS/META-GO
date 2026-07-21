import sys
import os
import io
from PIL import Image, ImageDraw, ImageFont

sys.path.append(os.path.abspath('backend'))
from credential_engine.services.ocr_pipeline import run_ocr_pipeline

def generate_dummy_image_bytes(size=(800, 500)):
    img = Image.new('RGB', size, color=(255, 255, 255))
    d = ImageDraw.Draw(img)
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

print("Starting raw OCR execution...")
valid_bytes = generate_dummy_image_bytes()
result = run_ocr_pipeline(valid_bytes, "Aadhaar")
print("Success:", result)
