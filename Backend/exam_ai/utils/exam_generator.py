import random
from typing import List, Dict, Any
from collections import defaultdict
import math

class ExamGenerator:
    """Advanced exam generator with intelligent question selection"""
    
    def __init__(self):
        self.difficulty_distribution = {
            'EASY': 0.3,
            'MEDIUM': 0.5,
            'HARD': 0.2
        }
        
        self.time_estimates = {
            'MCQ': 30, 'SHORT': 60, 'LONG': 180, 'TRUE_FALSE': 20,
            'FILL_BLANK': 40, 'MATCHING': 90, 'CALCULATION': 300,
            'ESSAY': 600, 'DIAGRAM': 480, 'CASE_STUDY': 900,
            'NUMERICAL': 240, 'DERIVATION': 360, 'PROOF': 480,
            'ANALYSIS': 420, 'COMPREHENSION': 300,
        }
        
        self.marks_map = {
            'MCQ': 2, 'SHORT': 5, 'LONG': 10, 'TRUE_FALSE': 1,
            'FILL_BLANK': 3, 'MATCHING': 8, 'CALCULATION': 15,
            'ESSAY': 20, 'DIAGRAM': 15, 'CASE_STUDY': 25,
            'NUMERICAL': 12, 'DERIVATION': 15, 'PROOF': 20,
            'ANALYSIS': 18, 'COMPREHENSION': 15,
        }
    
    def generate(self, questions: List[Any], total_questions: int = 20,
                 difficulty_distribution: Dict[str, float] = None,
                 type_distribution: Dict[str, float] = None,
                 topics: List[str] = None) -> Dict:
        """Generate an exam with balanced distribution"""
        
        if not questions:
            return self._empty_result()
        
        # Apply filters
        filtered_questions = self._apply_filters(questions, topics)
        
        if not filtered_questions:
            return self._empty_result()
        
        # Group questions
        by_difficulty = self._group_by_difficulty(filtered_questions)
        by_type = self._group_by_type(filtered_questions)
        
        # Set distributions
        diff_dist = difficulty_distribution or self.difficulty_distribution
        type_dist = type_distribution or self._get_default_type_dist(by_type)
        
        # Select questions
        selected = []
        difficulty_counts = defaultdict(int)
        type_counts = defaultdict(int)
        
        # Select by difficulty first
        for difficulty, percentage in diff_dist.items():
            target = int(total_questions * percentage)
            available = by_difficulty.get(difficulty, [])
            
            if available:
                # Try to maintain type diversity
                selected_from_difficulty = self._select_diverse_questions(
                    available, target, by_type
                )
                selected.extend(selected_from_difficulty)
                difficulty_counts[difficulty] = len(selected_from_difficulty)
        
        # Fill remaining if needed
        if len(selected) < total_questions:
            remaining_needed = total_questions - len(selected)
            all_questions = list(set(filtered_questions) - set(selected))
            if all_questions:
                additional = random.sample(all_questions, min(remaining_needed, len(all_questions)))
                selected.extend(additional)
                
                for q in additional:
                    difficulty_counts[q.difficulty] += 1
                    type_counts[q.question_type] += 1
        
        random.shuffle(selected)
        
        # Build exam
        exam_questions = []
        total_time = 0
        total_marks = 0
        
        for i, q in enumerate(selected[:total_questions], 1):
            time_est = self._get_time_estimate(q)
            marks = self._get_marks(q)
            
            exam_questions.append({
                'order': i,
                'id': str(q.id),
                'text': q.text,
                'type': q.question_type,
                'difficulty': q.difficulty,
                'options': q.options,
                'time_estimate': time_est,
                'marks': marks,
                'topic': getattr(q, 'topic', 'general'),
                'has_calculation': getattr(q, 'requires_calculation', False)
            })
            
            total_time += time_est
            total_marks += marks
            type_counts[q.question_type] += 1
        
        return {
            'questions': exam_questions,
            'difficulty_breakdown': dict(difficulty_counts),
            'type_breakdown': dict(type_counts),
            'total_time': total_time,
            'total_marks': total_marks,
            'total_questions': len(exam_questions),
            'time_limit_minutes': self.calculate_exam_duration(exam_questions)
        }
    
    def generate_exam(self, questions: List[Any], total_questions: int = 20,
                      difficulty_distribution: Dict[str, float] = None) -> Dict:
        """Alias for generate method"""
        return self.generate(questions, total_questions, difficulty_distribution)
    
    def _apply_filters(self, questions: List, topics: List[str]) -> List:
        """Apply topic filters"""
        if not topics:
            return questions
        
        filtered = []
        for q in questions:
            q_topic = getattr(q, 'topic', '').lower()
            if any(topic.lower() in q_topic for topic in topics):
                filtered.append(q)
        
        return filtered if filtered else questions
    
    def _group_by_difficulty(self, questions: List) -> Dict:
        """Group questions by difficulty"""
        groups = defaultdict(list)
        for q in questions:
            groups[q.difficulty].append(q)
        return dict(groups)
    
    def _group_by_type(self, questions: List) -> Dict:
        """Group questions by type"""
        groups = defaultdict(list)
        for q in questions:
            groups[q.question_type].append(q)
        return dict(groups)
    
    def _get_default_type_dist(self, by_type: Dict) -> Dict:
        """Get default type distribution based on available questions"""
        total = sum(len(qs) for qs in by_type.values())
        if total == 0:
            return {}
        
        distribution = {}
        for q_type, q_list in by_type.items():
            distribution[q_type] = len(q_list) / total
        
        return distribution
    
    def _select_diverse_questions(self, available: List, target_count: int,
                                   by_type: Dict) -> List:
        """Select questions maintaining type diversity"""
        if len(available) <= target_count:
            return available
        
        # Group by type
        available_by_type = defaultdict(list)
        for q in available:
            available_by_type[q.question_type].append(q)
        
        selected = []
        types = list(available_by_type.keys())
        
        # Distribute across types
        per_type = max(1, target_count // len(types))
        
        for q_type in types:
            type_questions = available_by_type[q_type]
            if type_questions:
                count = min(per_type, len(type_questions))
                selected.extend(random.sample(type_questions, count))
        
        # Fill remaining if needed
        if len(selected) < target_count:
            remaining = list(set(available) - set(selected))
            if remaining:
                additional = random.sample(remaining, min(target_count - len(selected), len(remaining)))
                selected.extend(additional)
        
        return selected[:target_count]
    
    def _get_time_estimate(self, question) -> int:
        """Get time estimate for a question"""
        base = self.time_estimates.get(question.question_type, 60)
        multipliers = {'EASY': 1, 'MEDIUM': 1.5, 'HARD': 2}
        multiplier = multipliers.get(question.difficulty, 1)
        
        # Add time for calculation questions
        extra = 30 if getattr(question, 'requires_calculation', False) else 0
        
        return int(base * multiplier) + extra
    
    def _get_marks(self, question) -> int:
        """Get marks for a question"""
        base = self.marks_map.get(question.question_type, 5)
        multipliers = {'EASY': 1, 'MEDIUM': 1.5, 'HARD': 2}
        multiplier = multipliers.get(question.difficulty, 1)
        
        return int(base * multiplier)
    
    def calculate_exam_duration(self, questions: List[Dict]) -> int:
        """Calculate total exam duration in minutes"""
        total_seconds = sum(q['time_estimate'] for q in questions)
        # Add 10% buffer for reading and review
        total_seconds = int(total_seconds * 1.1)
        # Convert to minutes, round up
        return (total_seconds + 59) // 60
    
    def _empty_result(self) -> Dict:
        """Return empty result structure"""
        return {
            'questions': [],
            'difficulty_breakdown': {},
            'type_breakdown': {},
            'total_time': 0,
            'total_marks': 0,
            'total_questions': 0,
            'time_limit_minutes': 0
        }
    
    def suggest_duration(self, questions: List[Dict]) -> Dict:
        """Suggest exam duration with breakdown"""
        total_seconds = sum(q['time_estimate'] for q in questions)
        
        return {
            'total_seconds': total_seconds,
            'total_minutes': total_seconds // 60,
            'recommended_minutes': (total_seconds + 59) // 60,
            'with_buffer_minutes': self.calculate_exam_duration(questions),
            'breakdown': [
                {
                    'type': q['type'],
                    'count': 1,
                    'time': q['time_estimate']
                }
                for q in questions
            ]
        }