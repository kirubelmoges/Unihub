import re
import unicodedata
from typing import List, Dict, Optional

class TextCleaner:
    """Advanced text cleaner for educational content"""
    
    @staticmethod
    def clean(text: str) -> str:
        """Clean text by removing extra whitespace and special characters"""
        if not text:
            return ""
        
        # Normalize Unicode characters
        text = unicodedata.normalize('NFKD', text)
        
        # Remove multiple newlines
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        # Remove multiple spaces
        text = re.sub(r' +', ' ', text)
        
        # Remove tabs
        text = text.replace('\t', ' ')
        
        # Fix common encoding issues
        replacements = {
            'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬀ': 'ff', 'ﬃ': 'ffi', 'ﬄ': 'ffl',
            '�': '', '•': '-', '·': '.', '…': '...', '—': '-', '–': '-',
            '«': '"', '»': '"', '‘': "'", '’': "'", '“': '"', '”': '"',
            '​': '',  # Zero-width space
            '\u200b': '',  # Zero-width space
            '\xa0': ' ',  # Non-breaking space
        }
        
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        # Remove empty lines
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        text = '\n'.join(lines)
        
        return text.strip()
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Alias for clean method"""
        return TextCleaner.clean(text)
    
    @staticmethod
    def normalize_whitespace(text: str) -> str:
        """Normalize whitespace in text"""
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    @staticmethod
    def split_into_sentences(text: str) -> List[str]:
        """Split text into sentences with improved accuracy"""
        # Handle common abbreviations
        text = re.sub(r'(Mr|Ms|Dr|Prof|Sr|Jr|vs|etc)\.', r'\1<abbr>', text)
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
        # Restore abbreviations
        sentences = [s.replace('<abbr>', '.') for s in sentences]
        return [s.strip() for s in sentences if s.strip()]
    
    @staticmethod
    def split_into_paragraphs(text: str) -> List[str]:
        """Split text into paragraphs"""
        paragraphs = re.split(r'\n\s*\n', text)
        return [p.strip() for p in paragraphs if p.strip()]
    
    @staticmethod
    def extract_numbers(text: str) -> List[str]:
        """Extract numbers that might be question numbers"""
        patterns = [
            r'\b\d+\.', r'\b\d+\)', r'\bQ\d+', r'Question\s+\d+',
            r'Problem\s+\d+', r'Exercise\s+\d+', r'\b\d+[a-z]\)',  # 1a)
        ]
        
        numbers = []
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            numbers.extend(matches)
        
        return list(set(numbers))
    
    @staticmethod
    def is_question(text: str) -> bool:
        """Check if text is likely a question"""
        if '?' in text:
            return True
        
        question_starters = [
            'what', 'why', 'how', 'when', 'where', 'who', 'which',
            'explain', 'describe', 'define', 'list', 'state',
            'calculate', 'find', 'show', 'prove', 'derive',
            'compare', 'contrast', 'discuss', 'analyze'
        ]
        
        text_lower = text.lower().strip()
        for starter in question_starters:
            if text_lower.startswith(starter):
                return True
        
        patterns = [
            r'^[Qq]uestion', r'^\d+[\.\)]', r'^[\(\[{]?\d+[\)\]}]',
            r'^[a-z]\)', r'^[ivx]+\)',  # Sub-questions
        ]
        
        for pattern in patterns:
            if re.match(pattern, text):
                return True
        
        return False
    
    @staticmethod
    def extract_keywords(text: str, max_keywords: int = 10) -> List[str]:
        """Extract important keywords from text"""
        # Remove stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'were', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
            'could', 'may', 'might', 'this', 'that', 'these', 'those', 'it'
        }
        
        # Extract words
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        
        # Filter stop words
        keywords = [w for w in words if w not in stop_words]
        
        # Count frequency
        from collections import Counter
        keyword_counts = Counter(keywords)
        
        # Return most common keywords
        return [word for word, count in keyword_counts.most_common(max_keywords)]
    
    @staticmethod
    def fix_ocr_errors(text: str) -> str:
        """Fix common OCR errors"""
        fixes = {
            r'\b0\b': 'O', r'\b1\b': 'l', r'lll': 'll', r'rn': 'm',
            r'cl': 'd', r'vv': 'w', r'vvv': 'w', r'ri': 'n', r'rn': 'm',
        }
        for pattern, replacement in fixes.items():
            text = re.sub(pattern, replacement, text)
        return text
    
    @staticmethod
    def extract_math_expressions(text: str) -> List[str]:
        """Extract mathematical expressions"""
        patterns = [
            r'\b\d+\s*[+\-*/]\s*\d+\b',  # 2+3
            r'\b\d+\s*=\s*\d+\b',  # 2=2
            r'\([^)]+\)',  # (expression)
            r'\b[A-Za-z]\s*=\s*[^,\n]+',  # x = value
        ]
        
        expressions = []
        for pattern in patterns:
            matches = re.findall(pattern, text)
            expressions.extend(matches)
        
        return list(set(expressions))