from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.utils import timezone
from django.db.models import Q, Count
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.middleware.csrf import get_token
import uuid
import re
import logging
import os
from datetime import datetime, timedelta

# Import utils - use the ones from your utils folder
from .utils import (
    FileParser,
    QuestionExtractor,
    ExamGenerator,
    OCRProcessor,
    AIGrader,
    ChapterExtractor,
    TextCleaner
)
from .models import *
from .serializers import *

# Set up logging
logger = logging.getLogger(__name__)


# ========== CSRF ENDPOINT ==========
@api_view(['GET'])
def get_csrf_token(request):
    """Get CSRF token for frontend"""
    return Response({'csrfToken': get_token(request)})


# ========== VIEWSETS ==========

class DocumentViewSet(viewsets.ModelViewSet):
    """Handle document uploads and processing"""
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        logger.info(f"Document created: {serializer.instance.id}")
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process document to extract questions"""
        document = self.get_object()
        logger.info(f"Processing document: {document.id} - {document.title}")
        
        try:
            file_path = document.file.path
            logger.info(f"File path: {file_path}")
            parser = FileParser()
            
            if document.file_type == 'PDF':
                text, page_count = parser.extract_text_from_pdf(file_path)
                document.total_pages = page_count
            elif document.file_type == 'DOCX':
                text = parser.extract_text_from_docx(file_path)
            else:
                text = parser.extract_text_from_txt(file_path)
            
            logger.info(f"Extracted text length: {len(text)} characters")
            logger.info(f"First 500 chars: {text[:500]}")
            
            # Extract questions using the imported QuestionExtractor
            extractor = QuestionExtractor()
            extracted_items = extractor.extract(text)
            
            logger.info(f"Extracted {len(extracted_items)} items")
            
            # Save questions
            questions = []
            for item in extracted_items:
                logger.info(f"Saving question: {item['text'][:50]}...")
                question = Question.objects.create(
                    document=document,
                    text=item['text'],
                    answer=item.get('answer', ''),
                    question_type=item.get('question_type', 'SHORT'),
                    difficulty=item.get('difficulty', 'MEDIUM'),
                    marks=item.get('marks', 10)
                )
                questions.append(QuestionSerializer(question).data)
            
            document.extracted_text = text[:5000]
            document.processed = True
            document.save()
            
            logger.info(f"✅ Saved {len(questions)} questions")
            
            return Response({
                'message': 'Document processed successfully',
                'questions_count': len(questions),
                'questions': questions
            })
            
        except Exception as e:
            logger.error(f"❌ Error processing document: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get all questions from document"""
        document = self.get_object()
        questions = document.questions.all()
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)


class ExamGenerationViewSet(viewsets.ViewSet):
    """Handle exam generation"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate exam from document"""
        logger.info("Exam generation request received")
        serializer = ExamGenerateSerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.error(f"Invalid serializer data: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        logger.info(f"Generate data: document_id={data['document_id']}, total_questions={data['total_questions']}")
        
        try:
            document = Document.objects.get(id=data['document_id'], user=request.user)
            logger.info(f"Found document: {document.id} - {document.title}")
        except Document.DoesNotExist:
            logger.error(f"Document not found: {data['document_id']}")
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get questions from document
        questions = list(document.questions.all())
        logger.info(f"Found {len(questions)} questions in document")
        
        if not questions:
            logger.warning("No questions found in document")
            return Response({'error': 'No questions found in document'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate exam
        generator = ExamGenerator()
        exam_data = generator.generate(questions, data['total_questions'])
        
        # Create temp exam
        temp_exam = TempExam.objects.create(
            user=request.user,
            title=data['title'],
            duration_minutes=data.get('custom_duration', 60),
            total_questions=len(exam_data['questions']),
            total_marks=exam_data['total_marks'],
            expires_at=timezone.now() + timedelta(hours=24)
        )
        logger.info(f"Created temp exam: {temp_exam.id}")
        
        # ========== ADD QUESTIONS TO EXAM ==========
        for eq in exam_data['questions']:
            try:
                question = Question.objects.get(id=eq['id'])
                TempExamQuestion.objects.create(
                    temp_exam=temp_exam,
                    question=question,
                    order=eq['order'],
                    marks=eq['marks']
                )
                logger.debug(f"Added question {eq['order']}: {question.text[:50]}...")
            except Question.DoesNotExist:
                logger.error(f"Question not found: {eq['id']}")
                continue
        
        # Verify questions were added
        added_count = temp_exam.questions.count()
        logger.info(f"Added {added_count} questions to exam")
        
        temp_serializer = TempExamSerializer(temp_exam)
        logger.info(f"Exam generation complete: {temp_exam.id} with {added_count} questions")
        
        return Response(temp_serializer.data)


class TempExamViewSet(viewsets.ModelViewSet):
    """Handle temporary exams"""
    serializer_class = TempExamSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TempExam.objects.filter(
            user=self.request.user,
            expires_at__gt=timezone.now()
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Get exam by ID"""
        try:
            temp_exam = self.get_queryset().get(pk=kwargs['pk'])
            logger.info(f"Retrieved exam: {temp_exam.id}")
            serializer = self.get_serializer(temp_exam)
            return Response(serializer.data)
        except TempExam.DoesNotExist:
            logger.warning(f"Exam not found: {kwargs['pk']}")
            return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @method_decorator(csrf_exempt)
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start an exam"""
        temp_exam = self.get_object()
        logger.info(f"Starting exam: {temp_exam.id}")
        
        if temp_exam.is_expired:
            logger.warning(f"Exam expired: {temp_exam.id}")
            return Response({'error': 'Exam has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create submission
        submission = ExamSubmission.objects.create(
            temp_exam=temp_exam,
            student_name=request.user.get_full_name() or request.user.username,
            student_email=request.user.email
        )
        logger.info(f"Created submission: {submission.id}")
        
        return Response({
            'submission_id': submission.id,
            'exam': TempExamSerializer(temp_exam).data,
            'started_at': submission.started_at,
            'time_limit_minutes': temp_exam.duration_minutes
        })
    
    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'])
    def submit_exam(self, request):
        """Submit exam answers - Handles duplicate prevention"""
        submission_id = request.data.get('submission_id')
        logger.info(f"Submitting exam: {submission_id}")
        
        # Validate submission exists
        try:
            submission = ExamSubmission.objects.get(id=submission_id)
        except ExamSubmission.DoesNotExist:
            logger.error(f"Submission not found: {submission_id}")
            return Response({'error': 'Submission not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if already submitted
        if submission.submitted_at:
            logger.warning(f"Exam already submitted: {submission_id}")
            return Response({
                'submission_id': submission.id,
                'message': 'Exam already submitted',
                'already_submitted': True,
                'submitted_at': submission.submitted_at
            }, status=status.HTTP_200_OK)
        
        # Get answers from request
        answers_data = request.data.get('answers', [])
        logger.info(f"Processing {len(answers_data)} answers for submission {submission_id}")
        
        created_count = 0
        updated_count = 0
        error_count = 0
        
        for ans_data in answers_data:
            question_id = ans_data.get('question_id')
            answer_text = ans_data.get('answer_text', '')
            
            if not question_id:
                logger.warning("Answer data missing question_id")
                error_count += 1
                continue
            
            try:
                question = Question.objects.get(id=question_id)
                
                # Use update_or_create to handle duplicates
                answer, created = Answer.objects.update_or_create(
                    submission=submission,
                    question=question,
                    defaults={
                        'answer_text': answer_text
                    }
                )
                
                if created:
                    created_count += 1
                    logger.debug(f"Created answer for question: {question_id}")
                else:
                    updated_count += 1
                    logger.debug(f"Updated answer for question: {question_id}")
                    
            except Question.DoesNotExist:
                logger.warning(f"Question not found: {question_id}")
                error_count += 1
                continue
            except Exception as e:
                logger.error(f"Error saving answer for question {question_id}: {str(e)}")
                error_count += 1
                continue
        
        # Mark submission as completed
        submission.submitted_at = timezone.now()
        submission.save()
        
        logger.info(f"Exam submitted successfully: {submission_id} "
                    f"(Created: {created_count}, Updated: {updated_count}, Errors: {error_count})")
        
        return Response({
            'submission_id': submission.id,
            'message': 'Exam submitted successfully',
            'answers_created': created_count,
            'answers_updated': updated_count,
            'answers_errors': error_count,
            'submitted_at': submission.submitted_at
        })


class GradingViewSet(viewsets.ViewSet):
    """Handle answer grading"""
    permission_classes = [IsAuthenticated]
    
    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'])
    def grade_submission(self, request):
        """Grade an exam submission"""
        submission_id = request.data.get('submission_id')
        logger.info(f"Grading submission: {submission_id}")
        
        try:
            submission = ExamSubmission.objects.get(id=submission_id)
        except ExamSubmission.DoesNotExist:
            logger.error(f"Submission not found: {submission_id}")
            return Response({'error': 'Submission not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Use the imported AIGrader
        grader = AIGrader()
        total_score = 0
        
        for answer in submission.answers.all():
            question = answer.question
            
            # Get marks for this question
            try:
                temp_q = TempExamQuestion.objects.get(
                    temp_exam=submission.temp_exam,
                    question=question
                )
                max_marks = temp_q.marks
            except TempExamQuestion.DoesNotExist:
                max_marks = question.marks
            
            result = grader.grade(
                question=question.text,
                correct_answer=question.answer,
                student_answer=answer.answer_text or "No answer",
                max_marks=max_marks
            )
            
            answer.score = result['score']
            answer.feedback = result['feedback']
            answer.graded_at = timezone.now()
            answer.save()
            
            total_score += result['score']
            logger.debug(f"Graded question {question.id}: {result['score']}/{max_marks}")
        
        submission.total_score = total_score
        submission.graded = True
        submission.save()
        
        logger.info(f"Grading complete for {submission_id}: {total_score}/{submission.temp_exam.total_marks}")
        
        return Response({
            'submission_id': str(submission.id),
            'total_score': total_score,
            'total_possible': submission.temp_exam.total_marks,
            'graded': True
        })


class SubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    """Handle exam submissions (read-only)"""
    serializer_class = ExamSubmissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ExamSubmission.objects.filter(
            temp_exam__user=self.request.user
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Get submission by ID"""
        submission_id = kwargs.get('pk')
        logger.info(f"Retrieving submission: {submission_id}")
        
        try:
            submission = ExamSubmission.objects.get(id=submission_id)
            
            # Check authorization
            if submission.temp_exam.user != request.user:
                logger.warning(f"Unauthorized access attempt for submission {submission_id} by user {request.user}")
                return Response(
                    {'error': 'Not authorized to view this submission'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = self.get_serializer(submission)
            return Response(serializer.data)
            
        except ExamSubmission.DoesNotExist:
            logger.error(f"Submission not found: {submission_id}")
            return Response(
                {'error': 'Submission not found'},
                status=status.HTTP_404_NOT_FOUND
            )