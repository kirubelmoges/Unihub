import re
import json
import string
from typing import List, Dict, Tuple, Optional
from collections import defaultdict
import numpy as np
from .text_cleaner import TextCleaner

class QuestionExtractor:
    """
    Advanced Question Extractor with Deep Search Capabilities
    Supports: Main questions, sub-questions (1a, 1b, etc.), and nested questions
    """
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key
        self.cleaner = TextCleaner()
        
        # Comprehensive question patterns
        self.question_patterns = {
            # Numbered questions
            'numbered': [
                r'^\s*(\d+)[\.\)]\s*(.+?)(?=\n\s*\d+[\.\)]|\Z)',
                r'^\s*Q\.?\s*(\d+)[\.:]\s*(.+?)(?=\n\s*Q\.?\s*\d+|\Z)',
                r'^\s*Question\s+(\d+)[:.]\s*(.+?)(?=\n\s*Question\s+\d+|\Z)',
            ],
            # Sub-questions (1a, 1b, 2a, etc.) - NEW!
            'sub_question': [
                r'^\s*(\d+)([a-z])[\.\)]\s*(.+?)(?=\n\s*\d+[a-z][\.\)]|\n\s*\d+[\.\)]|\Z)',
                r'^\s*(\d+)\.([a-z])\)\s*(.+?)(?=\n\s*\d+\.?[a-z]\)|\Z)',
                r'^\s*([a-z])\)\s*(.+?)(?=\n\s*[a-z]\)|\n\s*\d+[\.\)]|\Z)',
                r'^\s*\(([a-z])\)\s*(.+?)(?=\n\s*\([a-z]\)|\n\s*\d+[\.\)]|\Z)',
            ],
            # Roman numeral questions (i, ii, iii)
            'roman': [
                r'^\s*\(([ivx]+)\)\s*(.+?)(?=\n\s*\([ivx]+\)|\Z)',
                r'^\s*([ivx]+)\.\s*(.+?)(?=\n\s*[ivx]+\.|\Z)',
            ],
            # Question word starters
            'question_words': [
                r'^\s*(What|Why|How|When|Where|Who|Which|Whose|Whom)\s+(.+?)\?',
                r'^\s*(Explain|Describe|Define|Discuss|Analyze|Evaluate|Compare|Contrast)\s+(.+?)\?',
                r'^\s*(Calculate|Compute|Find|Determine|Solve|Evaluate)\s+(.+?)\?',
                r'^\s*(Prove|Show|Demonstrate|Verify|Justify)\s+(.+?)\?',
                r'^\s*(List|Enumerate|State|Name|Identify)\s+(.+?)\?',
            ],
            # MCQ patterns
            'mcq': [
                r'^\s*(?:Which of the following|Choose the correct|Select the option)\s*(.+?)\?',
                r'^\s*(?:MCQ|Multiple Choice)\s*(?:\d+)?\s*[:.]?\s*(.+?)\?',
            ],
            # True/False patterns
            'true_false': [
                r'^\s*(?:True or False|State whether true or false|Determine if)\s*(.+?)\?',
                r'^\s*(?:\d+\.\s*)?(?:True/False|T/F)\s*[:.]?\s*(.+?)\?',
            ],
            # Fill in the blank
            'fill_blank': [
                r'^\s*(?:Fill in the blank|Complete the sentence|Fill the blank)\s*[:.]?\s*(.+?)(?:___|______|_____)',
                r'^\s*(?:___|______|_____)\s*(.+?)\?',
            ],
            # Matching
            'matching': [
                r'^\s*(?:Match the following|Match the items|Matching)\s*(?:\d+)?\s*[:.]?\s*(.+?)(?=\n\s*[A-Z]\s+[0-9])',
            ],
            # Calculation
            'calculation': [
                r'^\s*(?:Calculate|Compute|Find the value of|Solve for|Evaluate)\s*(.+?)\?',
                r'^\s*(?:Determine|Estimate|Find|What is)\s*(?:the value of)?\s*(.+?)\?',
            ],
            # Derivation/Proof
            'derivation': [
                r'^\s*(?:Derive|Prove|Show that|Demonstrate that)\s*(.+?)(?:\?|\.)',
            ],
            # Case Study
            'case_study': [
                r'^\s*(?:Case Study|Case Scenario|Read the following)\s*(?:\d+)?\s*[:.]?\s*(.+?)(?=\n\s*Q|\n\s*Answer)',
            ],
            # Comprehension
            'comprehension': [
                r'^\s*(?:Read the passage|Based on the text|From the passage)\s*(.+?)(?=\n\s*Q\d|\n\s*Answer)',
            ],
        }
        
        # Answer patterns
        self.answer_patterns = [
            r'^\s*(?:Answer|Ans|Solution|Sol)\s*[:.]?\s*(.+?)(?=\n\s*(?:Q|Question|\d+\.)|\Z)',
            r'^\s*(?:Correct Answer|Right Answer)\s*[:.]?\s*(.+?)(?=\n\s*(?:Q|Question|\d+\.)|\Z)',
            r'^\s*(?:A:|Ans:|Answer:)\s*(.+?)(?=\n\s*(?:B:|C:|D:|Q|Question)|\Z)',
            r'^\s*\(?\s*([A-D])\s*\)?\s*(.+?)(?=\n\s*[A-D]\s*\)|\n\s*Q|\Z)',
        ]
        
        # Option patterns for MCQ
        self.option_patterns = [
            r'^\s*([A-D])\s*[\.)]\s*(.+?)(?=\n\s*[A-D]\s*[\.)]|\n\s*(?:Answer|Q)|\Z)',
            r'^\s*\(([A-D])\)\s*(.+?)(?=\n\s*\([A-D]\)|\n\s*(?:Answer|Q)|\Z)',
            r'^\s*([A-D])\s*[:]\s*(.+?)(?=\n\s*[A-D]\s*[:]|\n\s*(?:Answer|Q)|\Z)',
        ]
        
        # Difficulty indicators
        self.difficulty_indicators = {
            'EASY': ['basic', 'simple', 'easy', 'fundamental', 'define', 'list', 'state', 'name'],
            'MEDIUM': ['explain', 'describe', 'discuss', 'analyze', 'compare', 'contrast', 'calculate'],
            'HARD': ['derive', 'prove', 'evaluate', 'synthesize', 'critique', 'design', 'create', 'complex'],
        }
        
        # Topic keywords
        self.topic_keywords = {
            'science': ['science', 'biology', 'chemistry', 'physics', 'scientific', 'experiment', 'lab'],
            'mathematics': ['math', 'mathematics', 'algebra', 'calculus', 'geometry', 'equation', 'formula'],
            'history': ['history', 'historical', 'ancient', 'century', 'war', 'civilization', 'empire'],
            'literature': ['literature', 'novel', 'poem', 'poetry', 'author', 'writer', 'character'],
            'technology': ['technology', 'computer', 'software', 'hardware', 'programming', 'code', 'algorithm'],
            'business': ['business', 'management', 'marketing', 'finance', 'economy', 'strategy'],
            'engineering': ['engineering', 'mechanical', 'electrical', 'civil', 'chemical', 'design'],
        }
    
    def extract_questions(self, text: str, chapters: List[Dict] = None) -> List[Dict]:
        """Extract questions with deep analysis, including sub-questions"""
        cleaned_text = self.cleaner.clean_text(text)
        
        # Use multiple extraction methods
        extracted_items = []
        
        # Method 1: Structural extraction (numbered questions)
        items1 = self._extract_structural(cleaned_text)
        
        # Method 2: Sub-question extraction (NEW!)
        items2 = self._extract_sub_questions(cleaned_text)
        
        # Method 3: Pattern-based extraction (question words)
        items3 = self._extract_pattern_based(cleaned_text)
        
        # Method 4: Context-based extraction
        items4 = self._extract_context_based(cleaned_text)
        
        # Method 5: MCQ/Options extraction
        items5 = self._extract_mcq(cleaned_text)
        
        # Merge and deduplicate
        all_items = items1 + items2 + items3 + items4 + items5
        extracted_items = self._deduplicate_items(all_items)
        
        # Group questions by parent (for sub-questions)
        extracted_items = self._group_sub_questions(extracted_items)
        
        # Post-process: detect question type, difficulty, topic
        for item in extracted_items:
            if item['type'] == 'question':
                item['question_type'] = self._detect_question_type_deep(item['text'])
                item['difficulty'] = self._detect_difficulty(item['text'])
                item['topic'] = self._detect_topic(item['text'])
                item['subtopic'] = self._detect_subtopic(item['text'])
                item['requires_calculation'] = self._detects_calculation(item['text'])
                item['requires_diagram'] = self._detects_diagram(item['text'])
                item['marks'] = self._suggest_marks(item)
                item['time_estimate_seconds'] = self._estimate_time(item)
                item['hints'] = self._generate_hints(item['text'])
                item['confidence'] = self._calculate_confidence(item)
                item['has_sub_questions'] = len(item.get('sub_questions', [])) > 0
                
                # Extract options for MCQ
                if item['question_type'] == 'MCQ':
                    item['options'] = self._extract_options_from_context(text, item['text'])
        
        return extracted_items
    
    def extract(self, text: str) -> List[Dict]:
        """Main extraction method"""
        return self.extract_questions(text)
    
    def _extract_sub_questions(self, text: str) -> List[Dict]:
        """Extract sub-questions (1a, 1b, etc.)"""
        items = []
        lines = text.split('\n')
        
        current_parent = None
        current_sub_questions = []
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            # Look for main numbered question
            main_match = re.match(r'^(\d+)[\.\)]\s*(.+?)$', line)
            if main_match:
                # Save previous parent with its sub-questions
                if current_parent:
                    parent_item = {
                        'type': 'question',
                        'text': current_parent,
                        'sub_questions': current_sub_questions,
                        'has_sub_questions': len(current_sub_questions) > 0
                    }
                    items.append(parent_item)
                
                # Start new parent
                current_parent = main_match.group(2)
                current_sub_questions = []
                continue
            
            # Look for sub-question pattern (a), b), etc.)
            sub_match = re.match(r'^\s*([a-z])[\.\)]\s*(.+?)$', line)
            if sub_match and current_parent:
                sub_question = {
                    'type': 'sub_question',
                    'letter': sub_match.group(1),
                    'text': sub_match.group(2),
                    'parent': current_parent
                }
                
                # Look for answer to sub-question
                answer = self._find_answer_for_sub_question(lines, i, sub_match.group(1))
                sub_question['answer'] = answer
                
                current_sub_questions.append(sub_question)
                continue
            
            # Look for roman numeral sub-questions
            roman_match = re.match(r'^\s*\(([ivx]+)\)\s*(.+?)$', line)
            if roman_match and current_parent:
                sub_question = {
                    'type': 'sub_question',
                    'letter': roman_match.group(1),
                    'text': roman_match.group(2),
                    'parent': current_parent
                }
                answer = self._find_answer_for_sub_question(lines, i, roman_match.group(1))
                sub_question['answer'] = answer
                current_sub_questions.append(sub_question)
        
        # Add last parent
        if current_parent:
            parent_item = {
                'type': 'question',
                'text': current_parent,
                'sub_questions': current_sub_questions,
                'has_sub_questions': len(current_sub_questions) > 0
            }
            items.append(parent_item)
        
        return items
    
    def _find_answer_for_sub_question(self, lines: List[str], start_idx: int, letter: str) -> str:
        """Find answer for a sub-question"""
        # Look for answer in the next few lines
        for j in range(start_idx + 1, min(start_idx + 5, len(lines))):
            line = lines[j].strip()
            if not line:
                continue
            
            # Check for answer pattern with the letter
            match = re.search(rf'^\s*Answer\s*[:.]?\s*{letter}[.:]\s*(.+?)$', line, re.IGNORECASE)
            if match:
                return match.group(1).strip()
            
            # Check for generic answer
            match = re.search(r'^\s*Answer\s*[:.]?\s*(.+?)$', line, re.IGNORECASE)
            if match:
                return match.group(1).strip()
            
            # If we hit another question, stop
            if re.match(r'^\s*\d+[\.\)]', line) or re.match(r'^\s*[a-z][\.\)]', line):
                break
        
        return ""
    
    def _group_sub_questions(self, items: List[Dict]) -> List[Dict]:
        """Group sub-questions under their parent questions"""
        result = []
        i = 0
        while i < len(items):
            item = items[i]
            
            # If this is a parent with sub_questions already
            if item.get('sub_questions'):
                result.append(item)
                i += 1
                continue
            
            # Check if next items are sub-questions
            if i + 1 < len(items) and items[i + 1].get('type') == 'sub_question':
                parent = item
                sub_questions = []
                j = i + 1
                while j < len(items) and items[j].get('type') == 'sub_question':
                    sub_questions.append(items[j])
                    j += 1
                
                parent['sub_questions'] = sub_questions
                parent['has_sub_questions'] = True
                result.append(parent)
                i = j
            else:
                result.append(item)
                i += 1
        
        return result
    
    def _extract_structural(self, text: str) -> List[Dict]:
        """Extract based on document structure (numbered questions)"""
        items = []
        lines = text.split('\n')
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1
                continue
            
            # Look for numbered question patterns
            match = re.match(r'^(\d+)[\.\)]\s*(.+?)$', line)
            if match:
                q_num = match.group(1)
                q_text = match.group(2)
                
                # Collect question text (might span multiple lines)
                question = q_text
                j = i + 1
                while j < len(lines) and not re.match(r'^\d+[\.\)]', lines[j].strip()):
                    if lines[j].strip() and not lines[j].strip().startswith('Answer'):
                        question += ' ' + lines[j].strip()
                    j += 1
                
                # Look for answer
                answer = self._find_answer_for_question(lines, i, j, q_num)
                
                items.append({
                    'type': 'question',
                    'text': question,
                    'answer': answer,
                    'confidence': 0.9
                })
                
                i = j
            else:
                i += 1
        
        return items
    
    def _extract_pattern_based(self, text: str) -> List[Dict]:
        """Extract based on question word patterns"""
        items = []
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # Check all question patterns
            for category, patterns in self.question_patterns.items():
                for pattern in patterns:
                    match = re.search(pattern, sentence, re.IGNORECASE | re.DOTALL)
                    if match:
                        if len(match.groups()) >= 2:
                            q_text = match.group(2)
                        else:
                            q_text = match.group(1) if match.groups() else sentence
                        
                        items.append({
                            'type': 'question',
                            'text': q_text.strip(),
                            'answer': self._find_answer_in_context(text, sentence),
                            'confidence': 0.8,
                            'category': category
                        })
                        break
        
        return items
    
    def _extract_context_based(self, text: str) -> List[Dict]:
        """Extract using context analysis (paragraph structure)"""
        items = []
        paragraphs = re.split(r'\n\s*\n', text)
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            # Check if paragraph contains a question
            if '?' in para:
                # Split by sentences
                sentences = re.split(r'(?<=[.!?])\s+', para)
                question_sentences = [s for s in sentences if '?' in s]
                
                for q_sent in question_sentences:
                    # Look for answer in the same paragraph
                    answer = self._find_answer_in_paragraph(para, q_sent)
                    
                    items.append({
                        'type': 'question',
                        'text': q_sent.strip(),
                        'answer': answer,
                        'confidence': 0.7
                    })
        
        return items
    
    def _extract_mcq(self, text: str) -> List[Dict]:
        """Extract MCQ questions with options"""
        items = []
        lines = text.split('\n')
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1
                continue
            
            # Check for MCQ pattern
            if re.search(r'(?:which of the following|choose|select)', line, re.IGNORECASE):
                question = line
                options = []
                j = i + 1
                
                # Collect options
                while j < len(lines) and j < i + 6:
                    opt_line = lines[j].strip()
                    match = re.match(r'^\s*([A-D])\s*[\.)]\s*(.+?)$', opt_line)
                    if match:
                        options.append({
                            'letter': match.group(1),
                            'text': match.group(2)
                        })
                    j += 1
                
                # Find answer
                answer = self._find_mcq_answer(text, question, options)
                
                items.append({
                    'type': 'question',
                    'text': question,
                    'answer': answer,
                    'options': options,
                    'question_type': 'MCQ',
                    'confidence': 0.95
                })
                
                i = j
            else:
                i += 1
        
        return items
    
    def _find_answer_for_question(self, lines: List[str], start: int, end: int, q_num: str) -> str:
        """Find answer for a numbered question"""
        for j in range(end, min(end + 10, len(lines))):
            line = lines[j].strip()
            if not line:
                continue
            
            match = re.match(r'^\s*(?:Answer|Ans|Solution)\s*[:.]?\s*(.+?)$', line, re.IGNORECASE)
            if match:
                return match.group(1).strip()
            
            if re.match(rf'^\s*{q_num}\s*[.:)]', line):
                parts = re.split(rf'{q_num}\s*[.:)]', line, maxsplit=1)
                if len(parts) > 1:
                    return parts[1].strip()
        
        return ""
    
    def _find_answer_in_context(self, text: str, question: str) -> str:
        """Find answer in surrounding context"""
        pos = text.find(question)
        if pos != -1:
            context = text[pos + len(question):pos + 500]
            
            for pattern in self.answer_patterns:
                match = re.search(pattern, context, re.IGNORECASE | re.DOTALL)
                if match:
                    return match.group(1).strip()
        
        return ""
    
    def _find_answer_in_paragraph(self, paragraph: str, question: str) -> str:
        """Find answer within same paragraph"""
        parts = paragraph.split(question, 1)
        if len(parts) > 1:
            after_question = parts[1]
            sentences = re.split(r'(?<=[.!?])\s+', after_question)
            if sentences:
                answer = sentences[0].strip()
                if len(answer) < 200:
                    return answer
        
        return ""
    
    def _find_mcq_answer(self, text: str, question: str, options: List[Dict]) -> str:
        """Find correct answer for MCQ"""
        pos = text.find(question)
        if pos != -1:
            context = text[pos + len(question):pos + 300]
            
            answer_match = re.search(r'Answer\s*[:.]?\s*([A-D])', context, re.IGNORECASE)
            if answer_match:
                letter = answer_match.group(1)
                for opt in options:
                    if opt['letter'] == letter:
                        return opt['text']
            
            for opt in options:
                if opt['text'].lower() in context.lower():
                    return opt['text']
        
        return options[0]['text'] if options else ""
    
    def _detect_question_type_deep(self, text: str) -> str:
        """Deep detection of question type with multiple checks"""
        text_lower = text.lower()
        
        type_checks = {
            'MCQ': ['which of the following', 'choose', 'select', 'multiple choice'],
            'TRUE_FALSE': ['true or false', 'true/false', 't/f', 'state whether true or false'],
            'FILL_BLANK': ['fill in', 'complete the', 'blank', '___', '_____'],
            'MATCHING': ['match the following', 'matching', 'match items'],
            'CALCULATION': ['calculate', 'compute', 'find the value', 'solve', 'evaluate', 'determine'],
            'NUMERICAL': ['numerical', 'numeric', 'value of', 'how many', 'how much'],
            'DERIVATION': ['derive', 'prove', 'show that', 'demonstrate that'],
            'PROOF': ['prove that', 'proof of', 'show that'],
            'ESSAY': ['essay', 'write an essay', 'discuss in detail'],
            'ANALYSIS': ['analyze', 'analyse', 'evaluate', 'critique', 'assess'],
            'COMPREHENSION': ['comprehension', 'passage', 'text', 'reading'],
            'CASE_STUDY': ['case study', 'case scenario', 'case analysis'],
            'DIAGRAM': ['diagram', 'draw', 'sketch', 'illustrate', 'label'],
        }
        
        for q_type, keywords in type_checks.items():
            if any(keyword in text_lower for keyword in keywords):
                return q_type
        
        if len(text.split()) > 50:
            return 'LONG'
        
        return 'SHORT'
    
    def _detect_difficulty(self, text: str) -> str:
        """Detect difficulty level"""
        text_lower = text.lower()
        
        difficulty_scores = {'EASY': 0, 'MEDIUM': 0, 'HARD': 0}
        
        for level, keywords in self.difficulty_indicators.items():
            for keyword in keywords:
                if keyword in text_lower:
                    difficulty_scores[level] += 1
        
        if 'calculate' in text_lower or 'derive' in text_lower:
            difficulty_scores['HARD'] += 1
        if len(text.split()) > 30:
            difficulty_scores['MEDIUM'] += 1
        if len(text.split()) > 50:
            difficulty_scores['HARD'] += 1
        
        return max(difficulty_scores, key=difficulty_scores.get)
    
    def _detect_topic(self, text: str) -> str:
        """Detect main topic"""
        text_lower = text.lower()
        
        topic_scores = defaultdict(int)
        for topic, keywords in self.topic_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    topic_scores[topic] += 1
        
        if topic_scores:
            return max(topic_scores, key=topic_scores.get)
        return 'general'
    
    def _detect_subtopic(self, text: str) -> str:
        """Detect more specific subtopic"""
        words = re.findall(r'\b[a-z]{4,}\b', text.lower())
        if words:
            from collections import Counter
            common = Counter(words).most_common(3)
            return common[0][0] if common else ''
        return ''
    
    def _detects_calculation(self, text: str) -> bool:
        """Detect if question requires calculation"""
        calc_keywords = ['calculate', 'compute', 'find', 'determine', 'solve', 'evaluate', 
                        'value of', 'how many', 'how much', 'what is', 'equation']
        return any(keyword in text.lower() for keyword in calc_keywords)
    
    def _detects_diagram(self, text: str) -> bool:
        """Detect if question requires diagram"""
        diagram_keywords = ['diagram', 'draw', 'sketch', 'illustrate', 'label', 'graph', 'plot']
        return any(keyword in text.lower() for keyword in diagram_keywords)
    
    def _suggest_marks(self, item: Dict) -> int:
        """Suggest marks based on question type and difficulty"""
        marks_map = {
            'MCQ': 2, 'TRUE_FALSE': 1, 'FILL_BLANK': 3, 'SHORT': 5, 'LONG': 10,
            'CALCULATION': 15, 'NUMERICAL': 12, 'DERIVATION': 15, 'PROOF': 20,
            'ESSAY': 20, 'ANALYSIS': 18, 'COMPREHENSION': 15, 'CASE_STUDY': 25, 'DIAGRAM': 15,
        }
        
        difficulty_multipliers = {'EASY': 1, 'MEDIUM': 1.5, 'HARD': 2}
        
        q_type = item.get('question_type', 'SHORT')
        difficulty = item.get('difficulty', 'MEDIUM')
        
        base = marks_map.get(q_type, 5)
        multiplier = difficulty_multipliers.get(difficulty, 1)
        
        # For sub-questions, reduce marks
        if item.get('sub_questions'):
            base = base // 2
        
        return int(base * multiplier)
    
    def _estimate_time(self, item: Dict) -> int:
        """Estimate time in seconds to answer"""
        base_times = {
            'MCQ': 30, 'SHORT': 60, 'LONG': 180, 'TRUE_FALSE': 20, 'FILL_BLANK': 40,
            'MATCHING': 90, 'CALCULATION': 300, 'NUMERICAL': 240, 'DERIVATION': 360,
            'PROOF': 480, 'ESSAY': 600, 'ANALYSIS': 420, 'COMPREHENSION': 300,
            'CASE_STUDY': 900, 'DIAGRAM': 480,
        }
        
        difficulty_multipliers = {'EASY': 1, 'MEDIUM': 1.5, 'HARD': 2}
        
        q_type = item.get('question_type', 'SHORT')
        difficulty = item.get('difficulty', 'MEDIUM')
        
        base = base_times.get(q_type, 60)
        multiplier = difficulty_multipliers.get(difficulty, 1)
        
        # Add time for sub-questions
        if item.get('sub_questions'):
            base += len(item['sub_questions']) * 30
        
        return int(base * multiplier)
    
    def _generate_hints(self, text: str) -> List[str]:
        """Generate hints based on question content"""
        hints = []
        text_lower = text.lower()
        
        if self._detects_calculation(text):
            hints.append("Show your step-by-step calculations for partial credit")
            if 'formula' in text_lower:
                hints.append("Remember to write the formula before plugging in values")
            if 'unit' in text_lower:
                hints.append("Don't forget to include units in your final answer")
        
        if 'define' in text_lower:
            hints.append("Start with a clear statement of what is being defined")
            hints.append("Include key characteristics or examples")
        
        if 'explain' in text_lower:
            hints.append("Structure your answer with clear points")
            hints.append("Use examples to illustrate your explanation")
        
        if 'derive' in text_lower or 'prove' in text_lower:
            hints.append("Start with known equations or axioms")
            hints.append("Show each step clearly")
            hints.append("State your assumptions at the beginning")
        
        if len(text.split()) > 100:
            hints.append("Organize your answer with paragraphs or bullet points")
        
        return hints[:3]
    
    def _calculate_confidence(self, item: Dict) -> float:
        """Calculate confidence score for extraction"""
        confidence = 0.5
        
        if item.get('answer'):
            confidence += 0.2
        if item.get('options'):
            confidence += 0.1
        if len(item.get('text', '')) > 20:
            confidence += 0.1
        if '?' in item.get('text', ''):
            confidence += 0.1
        if item.get('has_sub_questions'):
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _extract_options_from_context(self, text: str, question: str) -> List[str]:
        """Extract MCQ options from surrounding context"""
        options = []
        pos = text.find(question)
        
        if pos != -1:
            context = text[pos:pos + 500]
            option_lines = re.findall(r'\n\s*([A-D])\s*[\.)]\s*(.+?)(?=\n\s*[A-D]|\n\s*Answer|\Z)', context, re.IGNORECASE | re.DOTALL)
            
            for letter, content in option_lines:
                options.append(f"{letter}. {content.strip()}")
        
        return options
    
    def _deduplicate_items(self, items: List[Dict]) -> List[Dict]:
        """Remove duplicate questions"""
        seen_texts = set()
        unique_items = []
        
        for item in items:
            text = item.get('text', '').lower().strip()
            if text not in seen_texts:
                seen_texts.add(text)
                unique_items.append(item)
        
        return unique_items