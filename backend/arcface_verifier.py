import cv2
import numpy as np
import os
from config import cfg

_app = None

def get_app():
    global _app
    if _app is None:
        # Import here to avoid heavy imports at module import time (makes tests faster)
        if os.environ.get("TEST_MODE") == "1":
            # In test mode we don't initialize the heavy model
            _app = None
            return _app
        print("Initializing InsightFace FaceAnalysis (buffalo_l)...")
        from insightface.app import FaceAnalysis

        # Load only detection and recognition modules on CPU to minimize memory and startup time
        _app = FaceAnalysis(name='buffalo_l', allowed_modules=['detection', 'recognition'], providers=['CPUExecutionProvider'])
        _app.prepare(ctx_id=0, det_size=(640, 640))
        print("InsightFace FaceAnalysis loaded successfully!")
    return _app

def extract_embedding(image_bytes) -> list:
    """
    Decodes image bytes, runs InsightFace detection + landmark alignment + ArcFace recognition,
    and returns a 512-dimensional L2-normalized face embedding list.
    """
    try:
        # 1. Decode image bytes
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Invalid image bytes. Unable to decode image.")
            
        # 2. Extract aligned face objects using InsightFace or simulator in TEST_MODE
        if cfg.TEST_MODE:
            try:
                from simulators import arcface_simulator
            except Exception:
                from simulators import arcface_simulator
            return arcface_simulator.extract_embedding(image_bytes)

        app = get_app()
        faces = app.get(img)

        # 3. Handle validation checks for face counts
        if len(faces) == 0:
            raise ValueError("No face detected in the image. Please ensure your face is fully visible.")
        if len(faces) > 1:
            raise ValueError("Multiple faces detected in the image. Please ensure only one face is visible.")

        face = faces[0]

        # 4. Safely extract normalized 512-dimensional embedding
        if hasattr(face, 'normed_embedding') and face.normed_embedding is not None:
            embedding = face.normed_embedding
        elif hasattr(face, 'embedding') and face.embedding is not None:
            emb = face.embedding
            norm = np.linalg.norm(emb)
            embedding = emb / norm if norm > 0 else emb
        else:
            raise ValueError("Failed to compute face embedding.")

        return embedding.tolist()
    except Exception as e:
        print(f"ArcFace embedding extraction error: {str(e)}")
        raise e

def compute_similarity(emb1: list, emb2: list) -> float:
    """
    Calculates cosine similarity (dot product of L2 normalized vectors).
    """
    return float(np.dot(emb1, emb2))
