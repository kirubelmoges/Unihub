import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import cv2
import numpy as np
import os
import re
from typing import Optional, Dict, List

class OCRProcessor:
    """Advanced OCR processor with multiple preprocessing techniques"""
    
    def __init__(self, tesseract_path: Optional[str] = None):
        if tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
        else:
            common_paths = [
                r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                r'/usr/bin/tesseract',
                r'/usr/local/bin/tesseract',
            ]
            for path in common_paths:
                if os.path.exists(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    break
    
    def preprocess_image(self, image_path: str, method: str = 'auto') -> np.ndarray:
        """Preprocess image using various methods"""
        img = cv2.imread(image_path)
        if img is None:
            raise Exception(f"Could not read image: {image_path}")
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        if method == 'auto':
            # Try multiple methods and pick best
            methods = {
                'otsu': self._otsu_threshold(gray),
                'adaptive': self._adaptive_threshold(gray),
                'morph': self._morphological_clean(gray),
                'dilate': self._dilate_text(gray),
            }
            
            # Choose method with best contrast
            best_method = max(methods.items(), key=lambda x: np.std(x[1]))
            return best_method[1]
        
        elif method == 'otsu':
            return self._otsu_threshold(gray)
        elif method == 'adaptive':
            return self._adaptive_threshold(gray)
        elif method == 'morph':
            return self._morphological_clean(gray)
        elif method == 'dilate':
            return self._dilate_text(gray)
        else:
            return gray
    
    def _otsu_threshold(self, gray: np.ndarray) -> np.ndarray:
        """Apply Otsu thresholding"""
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return thresh
    
    def _adaptive_threshold(self, gray: np.ndarray) -> np.ndarray:
        """Apply adaptive thresholding"""
        return cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                     cv2.THRESH_BINARY, 11, 2)
    
    def _morphological_clean(self, gray: np.ndarray) -> np.ndarray:
        """Clean image with morphological operations"""
        kernel = np.ones((1, 1), np.uint8)
        opening = cv2.morphologyEx(gray, cv2.MORPH_OPEN, kernel)
        return cv2.morphologyEx(opening, cv2.MORPH_CLOSE, kernel)
    
    def _dilate_text(self, gray: np.ndarray) -> np.ndarray:
        """Dilate text to make it thicker"""
        kernel = np.ones((1, 1), np.uint8)
        return cv2.dilate(gray, kernel, iterations=1)
    
    def extract_text(self, image_path: str, preprocess: bool = True, 
                    lang: str = 'eng', psm: int = 6) -> str:
        """Extract text from image with configurable OCR parameters"""
        try:
            # Preprocess image
            if preprocess:
                processed_img = self.preprocess_image(image_path)
                pil_img = Image.fromarray(processed_img)
            else:
                pil_img = Image.open(image_path)
            
            # Configure Tesseract
            config = f'--psm {psm} -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?()\'" '
            text = pytesseract.image_to_string(pil_img, lang=lang, config=config)
            
            # Post-process text
            text = self._postprocess_text(text)
            
            return text.strip()
            
        except Exception as e:
            raise Exception(f"OCR processing failed: {str(e)}")
    
    def extract_text_with_details(self, image_path: str) -> Dict:
        """Extract text with detailed confidence scores and word positions"""
        try:
            # Try multiple preprocessing methods
            methods = ['otsu', 'adaptive', 'morph']
            best_result = None
            best_confidence = 0
            
            for method in methods:
                processed = self.preprocess_image(image_path, method=method)
                pil_img = Image.fromarray(processed)
                
                data = pytesseract.image_to_data(pil_img, output_type=pytesseract.Output.DICT)
                
                # Calculate confidence
                confidences = [int(conf) for conf in data['conf'] if conf != '-1']
                avg_confidence = np.mean(confidences) if confidences else 0
                
                if avg_confidence > best_confidence:
                    best_confidence = avg_confidence
                    
                    # Extract text blocks
                    text_blocks = []
                    full_text = ""
                    
                    for i, word in enumerate(data['text']):
                        if word.strip() and int(data['conf'][i]) > 30:
                            text_blocks.append({
                                'word': word,
                                'confidence': float(data['conf'][i]),
                                'bbox': {
                                    'x': data['left'][i],
                                    'y': data['top'][i],
                                    'width': data['width'][i],
                                    'height': data['height'][i]
                                },
                                'line_num': data['line_num'][i],
                                'block_num': data['block_num'][i]
                            })
                            full_text += word + " "
                    
                    best_result = {
                        'text': full_text.strip(),
                        'words': text_blocks,
                        'avg_confidence': best_confidence,
                        'method': method,
                        'word_count': len(text_blocks),
                        'line_count': len(set(b['line_num'] for b in text_blocks)),
                        'has_numbers': any(re.search(r'\d', w['word']) for w in text_blocks)
                    }
            
            if best_result:
                best_result['cleaned_text'] = self._postprocess_text(best_result['text'])
                return best_result
            else:
                # Fallback
                text = self.extract_text(image_path, preprocess=False)
                return {
                    'text': text,
                    'cleaned_text': self._postprocess_text(text),
                    'avg_confidence': 0,
                    'word_count': len(text.split()),
                    'method': 'fallback'
                }
                
        except Exception as e:
            raise Exception(f"Detailed OCR failed: {str(e)}")
    
    def _postprocess_text(self, text: str) -> str:
        """Post-process OCR text"""
        # Fix common OCR errors
        replacements = {
            r'(\w)l(\w)': r'\1l\2',
            r'(\w)1(\w)': r'\1l\2',
            r'0': 'O',
            r'rn': 'm',
            r'cl': 'd',
            r'vv': 'w',
        }
        
        for pattern, replacement in replacements.items():
            text = re.sub(pattern, replacement, text)
        
        # Fix spacing
        text = re.sub(r'\s+', ' ', text)
        
        # Fix punctuation
        text = re.sub(r'\.{2,}', '.', text)
        text = re.sub(r',{2,}', ',', text)
        
        return text.strip()
    
    def extract_math(self, image_path: str) -> str:
        """Extract mathematical expressions"""
        try:
            img = cv2.imread(image_path)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Invert for white text on dark background
            inverted = cv2.bitwise_not(gray)
            
            # Threshold
            _, thresh = cv2.threshold(inverted, 150, 255, cv2.THRESH_BINARY)
            
            pil_img = Image.fromarray(thresh)
            
            # Use Tesseract with math mode
            custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789+-*/=().,xαβγπ∫∑√∞'
            text = pytesseract.image_to_string(pil_img, config=custom_config)
            
            return text.strip()
            
        except Exception as e:
            return f"Math extraction failed: {str(e)}"
    
    def extract_handwriting(self, image_path: str) -> str:
        """Specialized extraction for handwriting"""
        try:
            img = cv2.imread(image_path)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Increase contrast
            enhanced = cv2.equalizeHist(gray)
            
            # Denoise
            denoised = cv2.medianBlur(enhanced, 5)
            
            pil_img = Image.fromarray(denoised)
            
            # Use handwriting model if available
            text = pytesseract.image_to_string(pil_img, config='--psm 6 -c preserve_interword_spaces=1')
            
            return text.strip()
            
        except Exception as e:
            return f"Handwriting extraction failed: {str(e)}"