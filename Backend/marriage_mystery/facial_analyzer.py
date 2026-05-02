import cv2
import numpy as np
import tempfile
import os
from scipy.spatial import distance as dist

class FacialAnalyzer:
    def __init__(self):
        # OpenCV face detector
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_eye.xml'
        )
        self.smile_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_smile.xml'
        )
        print("✅ OpenCV facial analyzer initialized")
        
    def analyze(self, image_file, session_id):
        """Main analysis method"""
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
                for chunk in image_file.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name
            
            img = cv2.imread(tmp_path)
            if img is None:
                return None, None, 0, 'Could not decode image'
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray, 1.1, 5, minSize=(100, 100)
            )
            
            if len(faces) == 0:
                return None, None, 0, 'No face detected in the photograph'
            
            # Get the largest face
            x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
            face_roi = gray[y:y+h, x:x+w]
            face_color = img[y:y+h, x:x+w]
            
            # Extract features
            features = self._extract_features(face_roi, face_color, w, h, img, x, y)
            
            # Detect gender
            gender, confidence = self._detect_gender(features)
            
            return features, gender, confidence, None
            
        except Exception as e:
            return None, None, 0, str(e)
        
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    def _extract_features(self, gray, color, w, h, full_img, face_x, face_y):
        """Extract facial features using OpenCV only"""
        features = {}
        
        # 1. Eye size and detection
        eyes = self.eye_cascade.detectMultiScale(gray, 1.1, 5)
        if len(eyes) >= 2:
            avg_area = np.mean([e[2] * e[3] for e in eyes[:2]])
            features['eye_size'] = np.clip(avg_area / (w * h) * 400, 20, 80)
        else:
            features['eye_size'] = 50
        
        # 2. Eyebrow thickness (using edge detection in upper face)
        brow_region = gray[:h//3, :]
        if brow_region.size > 0:
            edges = cv2.Canny(brow_region, 50, 150)
            features['eyebrow_thickness'] = np.clip(np.sum(edges) / (edges.size + 1) * 5, 20, 80)
        else:
            features['eyebrow_thickness'] = 50
        
        # 3. Nose length (vertical gradient in center)
        nose_region = gray[h//3:2*h//3, w//3:2*w//3]
        if nose_region.size > 0:
            grad_y = cv2.Sobel(nose_region, cv2.CV_64F, 0, 1, ksize=3)
            features['nose_length'] = np.clip(np.mean(np.abs(grad_y)) * 3, 30, 80)
        else:
            features['nose_length'] = 50
        
        # 4. Nose width
        if nose_region.size > 0:
            grad_x = cv2.Sobel(nose_region, cv2.CV_64F, 1, 0, ksize=3)
            features['nose_width'] = np.clip(np.mean(np.abs(grad_x)) * 3, 30, 80)
        else:
            features['nose_width'] = 50
        
        # 5. Lip/Mouth size
        mouth_region = gray[2*h//3:3*h//4, w//4:3*w//4]
        if mouth_region.size > 0:
            features['lip_size'] = np.clip(mouth_region.shape[0] / h * 100, 20, 70)
        else:
            features['lip_size'] = 50
        
        # 6. Chin prominence
        chin_region = gray[-h//4:, w//4:3*w//4]
        if chin_region.size > 0:
            edges = cv2.Canny(chin_region, 50, 150)
            features['chin_prominence'] = np.clip(np.sum(edges) / (edges.size + 1) * 10, 20, 80)
        else:
            features['chin_prominence'] = 50
        
        # 7. Face shape (width/height ratio)
        face_ratio = w / h
        if face_ratio > 0.9:
            features['face_shape'] = 70  # Round
        elif face_ratio > 0.75:
            features['face_shape'] = 50  # Oval
        else:
            features['face_shape'] = 30  # Long
        
        # 8. Facial fullness (brightness)
        mean_intensity = np.mean(gray)
        features['facial_fullness'] = np.clip(100 - (mean_intensity / 255 * 100), 20, 80)
        
        # 9. Skin tone
        lab = cv2.cvtColor(color, cv2.COLOR_BGR2LAB)
        L = lab[:, :, 0].mean()
        features['skin_tone'] = np.clip(L, 20, 80)
        
        # 10. Lip color (saturation in mouth area)
        hsv = cv2.cvtColor(color, cv2.COLOR_BGR2HSV)
        mouth_h, mouth_w = mouth_region.shape
        if mouth_h > 0 and mouth_w > 0:
            mouth_hsv = hsv[2*h//3:3*h//4, w//4:3*w//4]
            if mouth_hsv.size > 0:
                features['lip_color'] = np.clip(np.mean(mouth_hsv[:, :, 1]), 20, 80)
            else:
                features['lip_color'] = 50
        else:
            features['lip_color'] = 50
        
        # 11. Hair color (top of face)
        hair_region = gray[:h//5, :]
        if hair_region.size > 0:
            features['hair_color'] = np.clip(np.mean(hair_region), 20, 200)
        else:
            features['hair_color'] = 50
        
        # 12. Forehead lines (texture)
        forehead = gray[:h//4, :]
        if forehead.size > 0:
            edges = cv2.Canny(forehead, 50, 150)
            features['forehead_lines'] = np.clip(np.sum(edges) / (edges.size + 1) * 20, 0, 50)
        else:
            features['forehead_lines'] = 20
        
        # 13. Beard fullness (lower face darkness)
        lower_face = gray[2*h//3:, :]
        if lower_face.size > 0:
            features['beard_fullness'] = np.clip(100 - (np.mean(lower_face) / 255 * 100), 10, 90)
        else:
            features['beard_fullness'] = 30
        
        # 14. Hair type (texture variance)
        if hair_region.size > 0:
            laplacian_var = cv2.Laplacian(hair_region, cv2.CV_64F).var()
            features['hair_type'] = np.clip(laplacian_var / 50, 20, 80)
        else:
            features['hair_type'] = 50
        
        # 15. Ear visibility (check face boundaries)
        features['ear_visibility'] = 50  # Default
        
        # 16. Smile intensity (mouth curvature)
        smiles = self.smile_cascade.detectMultiScale(mouth_region, 1.8, 20)
        features['smile_intensity'] = np.clip(len(smiles) * 30, 0, 100)
        
        # 17. Perceived confidence (head position)
        face_center_x = w / 2
        features['perceived_confidence'] = np.clip(abs(face_center_x - w/2) / w * 100, 20, 80)
        
        # 18. Perceived kindness (smile + eye openness)
        features['perceived_kindness'] = (features['smile_intensity'] + features['eye_size']) / 2
        
        # 19. Eyebrow arch (vertical span)
        if brow_region.size > 0:
            features['eyebrow_arch'] = np.clip(np.std(brow_region, axis=0).mean() / 10, 20, 80)
        else:
            features['eyebrow_arch'] = 50
        
        # 20. Eye spacing
        features['eye_spacing'] = 50  # Default
        
        # 21. Jaw definition
        jaw_region = gray[3*h//4:, w//4:3*w//4]
        if jaw_region.size > 0:
            edges = cv2.Canny(jaw_region, 50, 150)
            features['jaw_definition'] = np.clip(np.sum(edges) / (edges.size + 1) * 10, 20, 80)
        else:
            features['jaw_definition'] = 50
        
        return features
    
    def _detect_gender(self, features):
        """Detect gender based on facial features"""
        beard = features.get('beard_fullness', 0)
        jaw = features.get('jaw_definition', 50)
        brows = features.get('eyebrow_thickness', 50)
        face_shape = features.get('face_shape', 50)
        
        score = 50
        
        # Masculine indicators
        if beard > 50:
            score += 25
        if jaw > 55:
            score += 15
        if brows > 55:
            score += 10
        if face_shape < 40:  # Longer face = more masculine
            score += 5
        
        # Feminine indicators
        if beard < 20:
            score -= 15
        if jaw < 40:
            score -= 10
        if brows < 35:
            score -= 10
        
        if score > 65:
            return 'M', 0.75
        elif score < 35:
            return 'F', 0.75
        else:
            return 'M' if beard > 40 else 'F', 0.65