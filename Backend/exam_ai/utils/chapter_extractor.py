import re
from typing import List, Dict, Optional

class ChapterExtractor:
    """Advanced chapter extractor with multiple format support"""
    
    def __init__(self):
        self.chapter_patterns = [
            # Standard patterns
            (r'(?:^|\n)(?:CHAPTER|Chapter|Ch\.?|CH\.?)\s*([0-9]+|[IVXLCDM]+|[A-Z])\s*[:\-]?\s*([^\n]+)', 'CHAPTER'),
            (r'(?:^|\n)(?:UNIT|Unit|U\.?)\s*([0-9]+|[IVXLCDM]+)\s*[:\-]?\s*([^\n]+)', 'UNIT'),
            (r'(?:^|\n)(?:LESSON|Lesson|L\.?)\s*([0-9]+)\s*[:\-]?\s*([^\n]+)', 'LESSON'),
            (r'(?:^|\n)(?:SECTION|Section|Sec\.?)\s*([0-9]+(?:\.[0-9]+)?)\s*[:\-]?\s*([^\n]+)', 'SECTION'),
            (r'(?:^|\n)(?:MODULE|Module|Mod\.?)\s*([0-9]+)\s*[:\-]?\s*([^\n]+)', 'MODULE'),
            (r'(?:^|\n)(?:PART|Part|Pt\.?)\s*([0-9]+|[IVXLCDM]+|[A-Za-z]+)\s*[:\-]?\s*([^\n]+)', 'PART'),
            # Additional patterns for academic texts
            (r'(?:^|\n)(?:Topic|Topic\s+)\s*([0-9]+)\s*[:\-]?\s*([^\n]+)', 'TOPIC'),
            (r'(?:^|\n)(?:Week|Week\s+)\s*([0-9]+)\s*[:\-]?\s*([^\n]+)', 'WEEK'),
        ]
        
        self.page_patterns = [
            r'(?:Page|page|P\.?|p\.?)\s*([0-9]+)',
            r'\[([0-9]+)\]',
            r'\(([0-9]+)\)',
            r'^\s*(\d+)\s*$',  # Standalone page numbers
        ]
        
        self.subsection_patterns = [
            r'(?:^|\n)([0-9]+\.[0-9]+)\s*[:\-]?\s*([^\n]+)',
            r'(?:^|\n)([A-Z])\s*[:\-]?\s*([^\n]+)',
        ]
    
    def extract_chapters(self, text: str) -> List[Dict]:
        """Extract all chapters/units from text with content"""
        chapters = []
        lines = text.split('\n')
        
        current_chapter = None
        current_content = []
        chapter_start_line = 0
        chapter_start_page = None
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            # Check for chapter header
            chapter_match = self._is_chapter_header(line)
            subsection_match = self._is_subsection(line) if current_chapter else None
            
            if chapter_match:
                # Save previous chapter
                if current_chapter:
                    chapters.append(self._create_chapter(
                        current_chapter,
                        current_content,
                        chapter_start_line,
                        i - 1,
                        chapter_start_page
                    ))
                
                # Start new chapter
                current_chapter = chapter_match
                current_content = []
                chapter_start_line = i
                chapter_start_page = self._detect_page_number(line)
            
            elif subsection_match and current_chapter:
                # Store subsection as part of current chapter
                current_content.append(f"[SUBSECTION] {subsection_match['title']}")
            
            elif current_chapter:
                current_content.append(line)
        
        # Add last chapter
        if current_chapter:
            chapters.append(self._create_chapter(
                current_chapter,
                current_content,
                chapter_start_line,
                len(lines) - 1,
                chapter_start_page
            ))
        
        return chapters
    
    def _is_chapter_header(self, line: str) -> Optional[Dict]:
        """Check if line is a chapter header"""
        for pattern, chap_type in self.chapter_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                number = match.group(1).strip()
                title = match.group(2).strip() if len(match.groups()) > 1 else ""
                
                return {
                    'type': chap_type,
                    'number': number,
                    'title': title or line,
                    'full_header': line
                }
        return None
    
    def _is_subsection(self, line: str) -> Optional[Dict]:
        """Check if line is a subsection"""
        for pattern in self.subsection_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                return {
                    'number': match.group(1),
                    'title': match.group(2) if len(match.groups()) > 1 else ""
                }
        return None
    
    def _detect_page_number(self, text: str) -> Optional[int]:
        """Extract page number from text"""
        for pattern in self.page_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    pass
        return None
    
    def _create_chapter(self, chapter_info: Dict, content: List[str], 
                       start_line: int, end_line: int, 
                       start_page: Optional[int] = None) -> Dict:
        """Create chapter dictionary"""
        content_text = '\n'.join(content)
        
        # Calculate end page
        end_page = start_page
        if start_page:
            # Estimate pages based on content length
            words_per_page = 300
            word_count = len(content_text.split())
            page_estimate = word_count // words_per_page
            end_page = start_page + page_estimate
        
        return {
            'type': chapter_info['type'],
            'number': chapter_info['number'],
            'title': chapter_info['title'],
            'start_line': start_line,
            'end_line': end_line,
            'start_page': start_page,
            'end_page': end_page,
            'content': content_text,
            'word_count': len(content_text.split()),
            'line_count': len(content),
            'has_subsections': '[SUBSECTION]' in content_text
        }
    
    def get_chapter_by_range(self, chapters: List[Dict], 
                            start_chapter: str = None, 
                            end_chapter: str = None,
                            chapter_numbers: List[str] = None) -> List[Dict]:
        """Filter chapters by range or numbers"""
        if chapter_numbers:
            return [ch for ch in chapters if ch['number'] in chapter_numbers]
        
        if start_chapter and end_chapter:
            try:
                start = int(start_chapter)
                end = int(end_chapter)
                return [ch for ch in chapters if 
                       ch['number'].isdigit() and 
                       start <= int(ch['number']) <= end]
            except ValueError:
                pass
        
        return chapters
    
    def get_chapter_by_page(self, chapters: List[Dict], page: int) -> Optional[Dict]:
        """Find chapter containing a specific page"""
        for chapter in chapters:
            if chapter.get('start_page') and chapter.get('end_page'):
                if chapter['start_page'] <= page <= chapter['end_page']:
                    return chapter
        return None