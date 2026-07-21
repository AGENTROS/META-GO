import sys
import os
import cv2
import numpy as np
import urllib.request

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

from arcface_verifier import extract_embedding, compute_similarity

def run_test():
    print("=== Testing ArcFace / InsightFace Integration ===")
    
    # 1. Download a test face image of Barack Obama (with User-Agent)
    url = "https://upload.wikimedia.org/wikipedia/commons/8/8d/President_Barack_Obama.jpg"
    image_path = "test_face_eval.jpg"
    
    print("Downloading test face image...")
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response, open(image_path, 'wb') as out_file:
            out_file.write(response.read())
        print("Test face image downloaded successfully!")
    except Exception as e:
        print(f"Error downloading test face image: {e}")
        return False
        
    try:
        # Read the image
        img = cv2.imread(image_path)
        if img is None:
            print("Error: Failed to read downloaded test image.")
            return False
            
        print(f"Image read successfully. Shape: {img.shape}")
        
        # 2. Extract embedding of the full image
        print("Extracting embedding for original image...")
        _, img_bytes = cv2.imencode('.jpg', img)
        emb1 = extract_embedding(img_bytes.tobytes())
        print(f"Success! Embedding 1 length: {len(emb1)}, first 5 values: {emb1[:5]}")
        
        # 3. Create a slightly cropped/perturbed version of the face to test matching
        # Barack Obama's face bbox in this image is roughly around [1000, 220, 1630, 1150]
        # Let's crop the center of the image to simulate a webcam viewport
        h, w, _ = img.shape
        crop_img = img[50:h-50, 50:w-50] # Crop border slightly
        _, crop_bytes = cv2.imencode('.jpg', crop_img)
        
        print("Extracting embedding for cropped image...")
        emb2 = extract_embedding(crop_bytes.tobytes())
        print(f"Success! Embedding 2 length: {len(emb2)}, first 5 values: {emb2[:5]}")
        
        # 4. Compute similarity
        sim_diff = compute_similarity(emb1, emb2)
        print(f"Similarity between original and cropped face: {sim_diff:.4f}")
        
        # Self-similarity check
        sim_self = compute_similarity(emb1, emb1)
        print(f"Self-similarity: {sim_self:.4f}")
        
        # Cleanup
        if os.path.exists(image_path):
            os.remove(image_path)
            
        # Assertions
        assert len(emb1) == 512, "Embedding length must be 512"
        assert abs(sim_self - 1.0) < 1e-4, "Self-similarity must be close to 1.0"
        assert sim_diff > 0.60, "Overlap crop similarity should be high (> 0.60)"
        
        print("\n=== SUCCESS: ArcFace model & alignment are running properly and verified! ===")
        return True
    except Exception as e:
        print(f"\n=== FAILURE: Test failed with error: {e} ===")
        if os.path.exists(image_path):
            os.remove(image_path)
        return False

if __name__ == "__main__":
    run_test()
