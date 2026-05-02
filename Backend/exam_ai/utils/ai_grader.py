import re
import json
from typing import Dict, List, Optional
import difflib

class AIGrader:
    """Advanced AI Grader with support for sub-questions and multiple question types"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key
    
    def grade_answer(self, question: str, correct_answer: str, 
                     student_answer: str, max_marks: int = 10,
                     question_type: str = 'SHORT',
                     is_sub_question: bool = False,
                     parent_question: str = None) -> Dict:
        """Grade a single answer based on question type"""
        
        # Always include metadata
        result = {
            "correct_answer": correct_answer,
            "student_answer": student_answer,
            "question_text": question,
            "is_sub_question": is_sub_question,
            "parent_question": parent_question
        }
        
        # Handle different question types
        if question_type == 'CALCULATION' or question_type == 'NUMERICAL':
            grade_result = self._grade_numerical(question, correct_answer, student_answer, max_marks)
        elif question_type == 'TRUE_FALSE':
            grade_result = self._grade_true_false(question, correct_answer, student_answer, max_marks)
        elif question_type == 'MCQ':
            grade_result = self._grade_mcq(question, correct_answer, student_answer, max_marks)
        elif question_type == 'FILL_BLANK':
            grade_result = self._grade_fill_blank(question, correct_answer, student_answer, max_marks)
        elif question_type == 'MATCHING':
            grade_result = self._grade_matching(question, correct_answer, student_answer, max_marks)
        else:
            grade_result = self._grade_text_advanced(question, correct_answer, student_answer, max_marks)
        
        # Adjust marks for sub-questions (usually worth less)
        if is_sub_question and grade_result.get('score', 0) > 0:
            grade_result['score'] = round(grade_result['score'] * 0.7, 1)
            grade_result['feedback'] += "\n\n(Note: This is a sub-question, so marks have been adjusted accordingly.)"
        
        result.update(grade_result)
        return result
    
    def grade(self, question: str, correct_answer: str, student_answer: str, max_marks: int = 10) -> Dict:
        """Simple grade method"""
        return self.grade_answer(question, correct_answer, student_answer, max_marks)
    
    def grade_batch(self, answers: List[Dict]) -> List[Dict]:
        """Grade multiple answers (for a batch of questions)"""
        results = []
        for ans in answers:
            result = self.grade_answer(
                question=ans.get('question', ''),
                correct_answer=ans.get('correct_answer', ''),
                student_answer=ans.get('student_answer', ''),
                max_marks=ans.get('max_marks', 10),
                question_type=ans.get('question_type', 'SHORT'),
                is_sub_question=ans.get('is_sub_question', False),
                parent_question=ans.get('parent_question')
            )
            results.append(result)
        return results
    
    def _grade_numerical(self, question: str, correct: str, student: str, max_marks: int) -> Dict:
        """Grade numerical/calculation answers with tolerance"""
        correct_numbers = re.findall(r'-?\d+\.?\d*', correct)
        student_numbers = re.findall(r'-?\d+\.?\d*', student)
        
        score = 0
        feedback = []
        matched_values = []
        
        for correct_num in correct_numbers:
            if correct_num in student_numbers:
                score += max_marks / len(correct_numbers)
                matched_values.append(correct_num)
                feedback.append(f"✓ Correct value: {correct_num}")
            else:
                found = False
                for student_num in student_numbers:
                    try:
                        error = abs(float(correct_num) - float(student_num)) / float(correct_num)
                        if error < 0.05:
                            score += (max_marks / len(correct_numbers)) * 0.7
                            matched_values.append(student_num)
                            feedback.append(f"~ Approximate value: {student_num} (expected {correct_num})")
                            found = True
                            break
                        elif error < 0.1:
                            score += (max_marks / len(correct_numbers)) * 0.5
                            matched_values.append(student_num)
                            feedback.append(f"≈ Near value: {student_num} (expected {correct_num})")
                            found = True
                            break
                    except (ValueError, ZeroDivisionError):
                        continue
                if not found:
                    feedback.append(f"✗ Missing value: {correct_num}")
        
        # Check for units
        unit_patterns = ['cm', 'm', 'km', 'kg', 'g', 'l', 'ml', '°C', '°F', 'K', 's', 'min', 'hr', 'mph', 'km/h']
        units_found = [u for u in unit_patterns if u in student.lower()]
        if units_found:
            score += 1
            feedback.append(f"✓ Units included: {', '.join(units_found)}")
        
        # Check for formula
        if 'formula' in student.lower() or '=' in student:
            score += 1
            feedback.append("✓ Formula shown")
        
        score = min(round(score, 1), max_marks)
        
        return {
            "score": score,
            "feedback": "\n".join(feedback) if feedback else "No numerical values detected",
            "strengths": ["Numerical values provided"] if student_numbers else [],
            "weaknesses": ["Calculation may need review"] if score < max_marks else [],
            "matched_values": matched_values
        }
    
    def _grade_true_false(self, question: str, correct: str, student: str, max_marks: int) -> Dict:
        """Grade true/false answers with explanation"""
        correct_lower = correct.lower().strip()
        student_lower = student.lower().strip()
        
        correct_bool = 'true' in correct_lower or 't' == correct_lower
        student_bool = 'true' in student_lower or 't' == student_lower
        
        if correct_bool == student_bool:
            score = max_marks
            feedback = f"✓ Correct! The statement is {correct}."
        else:
            score = 0
            feedback = f"✗ Incorrect. The statement is actually {correct}. "
            feedback += self._generate_true_false_explanation(question, correct)
        
        return {
            "score": score,
            "feedback": feedback,
            "strengths": ["Understood the concept"] if score == max_marks else [],
            "weaknesses": ["Misunderstood the statement"] if score == 0 else []
        }
    
    def _generate_true_false_explanation(self, question: str, correct: str) -> str:
        """Generate explanation for true/false answer"""
        explanations = {
            'true': "This statement is correct based on established facts.",
            'false': "This statement is incorrect because it contradicts known information."
        }
        return explanations.get(correct.lower(), "Review the concept to understand why.")
    
    def _grade_mcq(self, question: str, correct: str, student: str, max_marks: int) -> Dict:
        """Grade multiple choice answers with option matching"""
        # Extract option letters
        correct_letter = re.search(r'[A-D]', correct.upper())
        student_letter = re.search(r'[A-D]', student.upper())
        
        if correct_letter and student_letter:
            if correct_letter.group() == student_letter.group():
                score = max_marks
                feedback = f"✓ Correct! Option {correct_letter.group()} is right."
            else:
                score = 0
                feedback = f"✗ Incorrect. The correct answer is {correct_letter.group()}: {correct}"
        else:
            # Fallback to text matching
            return self._grade_text_advanced(question, correct, student, max_marks)
        
        return {
            "score": score,
            "feedback": feedback,
            "strengths": ["Selected correct answer"] if score == max_marks else [],
            "weaknesses": ["Chose wrong option"] if score == 0 else []
        }
    
    def _grade_matching(self, question: str, correct: str, student: str, max_marks: int) -> Dict:
        """Grade matching questions"""
        # Parse matching pairs
        correct_pairs = self._parse_matching_pairs(correct)
        student_pairs = self._parse_matching_pairs(student)
        
        correct_matches = 0
        for correct_pair in correct_pairs:
            if correct_pair in student_pairs:
                correct_matches += 1
        
        if correct_pairs:
            score = (correct_matches / len(correct_pairs)) * max_marks
        else:
            score = 0
        
        score = round(score, 1)
        
        if score == max_marks:
            feedback = "✓ Perfect! All matches are correct."
        elif score >= max_marks * 0.7:
            feedback = "~ Good effort! Most matches are correct."
        elif score > 0:
            feedback = f"~ Partial credit. {correct_matches} out of {len(correct_pairs)} matches correct."
        else:
            feedback = "✗ No correct matches. Review the matching pairs."
        
        return {
            "score": score,
            "feedback": feedback,
            "strengths": [f"{correct_matches} correct matches"] if correct_matches > 0 else [],
            "weaknesses": [f"{len(correct_pairs) - correct_matches} incorrect matches"] if correct_matches < len(correct_pairs) else []
        }
    
    def _parse_matching_pairs(self, text: str) -> List[tuple]:
        """Parse matching pairs from text"""
        pairs = []
        # Look for patterns like "A-1", "A:1", "A matches 1"
        pattern = r'([A-D])\s*[-:]\s*(\d+)'
        matches = re.findall(pattern, text.upper())
        for match in matches:
            pairs.append((match[0], match[1]))
        return pairs
    
    def _grade_fill_blank(self, question: str, correct: str, student: str, max_marks: int) -> Dict:
        """Grade fill in the blank answers with keyword matching"""
        # Extract key terms from correct answer
        correct_keywords = set(re.findall(r'\b\w+\b', correct.lower()))
        student_keywords = set(re.findall(r'\b\w+\b', student.lower()))
        common = correct_keywords.intersection(student_keywords)
        
        if len(correct_keywords) > 0:
            score = (len(common) / len(correct_keywords)) * max_marks
        else:
            score = 0
        
        # Check for exact match
        if student.lower().strip() == correct.lower().strip():
            score = max_marks
            feedback = f"✓ Perfect! Exact match. Correct answer: {correct}"
        elif len(common) == len(correct_keywords):
            score = max_marks * 0.9
            feedback = f"✓ Good! All key terms present. Correct answer: {correct}"
        elif len(common) > len(correct_keywords) * 0.7:
            feedback = f"~ Good attempt, but missing some key terms. Correct answer: {correct}"
        elif len(common) > 0:
            feedback = f"~ Partial credit. Some key terms identified. Correct answer: {correct}"
        else:
            feedback = f"✗ Review the correct answer: {correct}"
        
        # Show missing keywords
        missing = correct_keywords - student_keywords
        if missing and score < max_marks:
            feedback += f"\n\nMissing keywords: {', '.join(list(missing)[:5])}"
        
        return {
            "score": round(score, 1),
            "feedback": feedback,
            "strengths": ["Key terms identified"] if len(common) > 0 else [],
            "weaknesses": ["Missing key terms"] if len(common) < len(correct_keywords) else [],
            "keywords_matched": len(common),
            "keywords_total": len(correct_keywords)
        }
    
    def _grade_text_advanced(self, question: str, correct: str, student: str, max_marks: int) -> Dict:
        """Advanced text grading with semantic similarity"""
        
        # 1. Word overlap
        correct_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', correct.lower()))
        student_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', student.lower()))
        
        # 2. Calculate Jaccard similarity
        if correct_words:
            jaccard = len(correct_words & student_words) / len(correct_words)
        else:
            jaccard = 0
        
        # 3. Sequence matching
        seq_match = difflib.SequenceMatcher(None, correct.lower(), student.lower()).ratio()
        
        # 4. Combined score
        similarity = (jaccard * 0.7) + (seq_match * 0.3)
        score = round(similarity * max_marks, 1)
        
        # 5. Check for key concepts
        key_concepts = self._extract_key_concepts(correct)
        concepts_found = [c for c in key_concepts if c in student.lower()]
        
        # 6. Generate detailed feedback
        if score >= max_marks * 0.8:
            feedback = "Excellent answer! You covered most key points."
            strengths = ["Good understanding", "Covered key points"]
            weaknesses = ["Could provide more details"]
        elif score >= max_marks * 0.6:
            feedback = "Good answer, but missing some important details."
            strengths = ["Shows understanding of basic concepts"]
            weaknesses = ["Missing some key details", "Could be more comprehensive"]
        elif score >= max_marks * 0.4:
            feedback = "Fair attempt. Review the topic for better understanding."
            strengths = ["Attempted the question"]
            weaknesses = ["Missing key concepts", "Needs more thorough explanation"]
        else:
            feedback = "Needs improvement. Please study this topic again."
            strengths = ["Made an attempt"]
            weaknesses = ["Significant gaps in understanding", "Review the core concepts"]
        
        # Add concept feedback
        if key_concepts and concepts_found:
            feedback += f"\n\n✓ Key concepts identified: {', '.join(concepts_found[:3])}"
        elif key_concepts:
            feedback += f"\n\n⚠️ Missing key concepts: {', '.join(key_concepts[:3])}"
        
        # Add correct answer
        feedback += f"\n\n📖 Correct answer: {correct}"
        
        return {
            "score": score,
            "feedback": feedback,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "similarity_score": round(similarity, 2),
            "keywords_matched": len(correct_words & student_words),
            "keywords_total": len(correct_words),
            "key_concepts_found": concepts_found
        }
    
    def _extract_key_concepts(self, text: str) -> List[str]:
        """Extract key concepts from text"""
        # Remove common words and get important terms
        common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        words = re.findall(r'\b[a-z]{4,}\b', text.lower())
        key_concepts = [w for w in words if w not in common_words]
        
        # Get unique concepts
        from collections import Counter
        unique_concepts = list(dict.fromkeys(key_concepts))
        return unique_concepts[:5]  # Return top 5
    
    def _grade_text(self, question: str, correct: str, student: str, max_marks: int) -> Dict:
        """Original text grading method"""
        correct_words = set(correct.lower().split())
        student_words = set(student.lower().split())
        common = correct_words.intersection(student_words)
        
        if len(correct_words) > 0:
            similarity = len(common) / len(correct_words)
        else:
            similarity = 0
        
        score = round(similarity * max_marks, 1)
        
        if score >= max_marks * 0.8:
            feedback = f"Excellent answer! You covered most key points.\n\nCorrect answer: {correct}"
            strengths = ["Good understanding", "Covered key points"]
            weaknesses = ["Could provide more details"]
        elif score >= max_marks * 0.6:
            feedback = f"Good answer, but missing some important details.\n\nCorrect answer: {correct}"
            strengths = ["Shows understanding"]
            weaknesses = ["Missing key details"]
        elif score >= max_marks * 0.4:
            feedback = f"Fair attempt. Review the topic.\n\nCorrect answer: {correct}"
            strengths = ["Attempted the question"]
            weaknesses = ["Missing key concepts"]
        else:
            feedback = f"Needs improvement. Please study this topic.\n\nCorrect answer: {correct}"
            strengths = ["Made an attempt"]
            weaknesses = ["Significant gaps in understanding"]
        
        return {
            "score": score,
            "feedback": feedback,
            "strengths": strengths,
            "weaknesses": weaknesses
        }