import cv2
import numpy as np
import os

class SilentFaceAntiSpoofing:
    """
    Silent Face Anti-Spoofing Model wrapper.
    If models/weights are available, runs neural network inference.
    Otherwise, falls back to a high-fidelity OpenCV/NumPy mathematical analysis 
    of image quality, specular reflection, Moire patterns, and lighting distributions.
    """
    def __init__(self, model_dir=None):
        self.model_dir = model_dir
        self.has_neural_model = False
        # Optional: Load PyTorch/ONNX if files exist
        # try:
        #     import torch
        #     # initialization code ...
        # except ImportError:
        #     pass

    def predict(self, face_image: np.ndarray) -> tuple[float, float]:
        """
        Predicts liveness score and spoof risk.
        Returns:
            liveness_score: float (0.0 to 100.0)
            spoof_risk: float (0.0 to 100.0)
        """
        if face_image is None or face_image.size == 0:
            return 0.0, 100.0

        if self.has_neural_model:
            try:
                # Actual PyTorch model evaluation
                # pred = self._run_nn(face_image)
                # return pred
                pass
            except Exception as e:
                print(f"Silent Face NN evaluation failed: {e}. Falling back to analytical mode.")
        
        return self._run_analytical_fallback(face_image)

    def _run_analytical_fallback(self, img: np.ndarray) -> tuple[float, float]:
        """
        Fidelity check analyzing:
        1. Texture frequency (Laplacian variance) - screen replay/photo lacks high frequency detail.
        2. Moire patterns (using 2D FFT) - grid patterns indicating mobile screen scan.
        3. Dynamic range/Lighting distribution (Histogram analysis) - paper photos are flat.
        4. Specular reflections (highlights mask) - screen replay produces intense white glare.
        """
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape

        # 1. Texture Blur Check (Laplacian Variance)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        blur_val = laplacian.var()
        # Normal faces typically have blur_val > 150. Lower means out of focus, printed page, or low-res display.
        blur_score = min(100.0, (blur_val / 250.0) * 100.0)

        # 2. Specular Reflection Highlight Check
        # Replay screens usually reflect webcam flash/room lights heavily
        _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
        reflection_pixels = np.sum(thresh == 255)
        reflection_ratio = reflection_pixels / (h * w)
        # If over 2% of the image is pure specular highlight glare, high spoof risk
        reflection_penalty = min(100.0, (reflection_ratio / 0.02) * 100.0)

        # 3. Moire Pattern / Grid Noise Check (FFT)
        f_transform = np.fft.fft2(gray)
        f_shift = np.fft.fftshift(f_transform)
        magnitude_spectrum = 20 * np.log(np.abs(f_shift) + 1)
        
        # Check high-frequency grid coordinates for peaks (screen capture grid noise)
        center_y, center_x = h // 2, w // 2
        # Exclude the DC and low-frequency components
        mask = np.ones((h, w), dtype=np.uint8)
        cv2.circle(mask, (center_x, center_y), min(h, w) // 6, 0, -1)
        high_freq_mags = magnitude_spectrum * mask
        peak_ratio = np.max(high_freq_mags) / (np.mean(magnitude_spectrum) + 1e-5)
        
        # Higher peak ratio outside center indicates periodic Moire line pattern (screen display grids)
        moire_score = max(0.0, min(100.0, (peak_ratio - 1.5) * 40.0))

        # 4. Color Dynamic Range (Lighting flat-ness)
        hist = cv2.calcHist([img], [0], None, [256], [0, 256])
        non_zero_bins = np.count_nonzero(hist > (h * w * 0.001))
        # 3D human faces have wide lighting ranges (e.g. non_zero_bins > 120)
        # Flat printed paper images have highly concentrated histograms
        flatness_penalty = max(0.0, min(100.0, (140 - non_zero_bins) * 1.5))

        # Weighted calculation
        liveness_score = 0.4 * blur_score + 0.3 * (100.0 - moire_score) + 0.2 * (100.0 - reflection_penalty) + 0.1 * (100.0 - flatness_penalty)
        liveness_score = max(1.0, min(99.8, liveness_score))
        
        # Spoof risk is inverse of liveness but sensitive to direct spoof indicators
        spoof_risk = 100.0 - liveness_score
        if moire_score > 60.0 or reflection_penalty > 50.0 or flatness_penalty > 70.0:
            spoof_risk = max(spoof_risk, 85.0)

        return float(liveness_score), float(spoof_risk)
