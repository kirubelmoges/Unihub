from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import *

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']

class ChapterSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source='document.title', read_only=True)
    question_count = serializers.SerializerMethodField()
    question_types = serializers.SerializerMethodField()
    
    class Meta:
        model = Chapter
        fields = ['id', 'title', 'chapter_type', 'chapter_number', 'start_page', 
                 'end_page', 'content_preview', 'document', 'document_title', 
                 'question_count', 'question_types', 'created_at']
    
    def get_question_count(self, obj):
        return obj.questions.count()
    
    def get_question_types(self, obj):
        return obj.questions.values('question_type').distinct().count()

class QuestionSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source='document.title', read_only=True)
    chapter_title = serializers.CharField(source='chapter.title', read_only=True)
    chapter_number = serializers.CharField(source='chapter.chapter_number', read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'text', 'answer', 'question_type', 'difficulty', 
                 'options', 'topic', 'subtopic', 'page_number', 'time_estimate_seconds',
                 'marks', 'requires_calculation', 'requires_diagram', 'formula_needed',
                 'hints', 'document', 'document_title', 'chapter', 'chapter_title',
                 'chapter_number', 'created_at']

class DocumentSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    filename = serializers.SerializerMethodField()
    chapters = ChapterSerializer(many=True, read_only=True)
    chapter_count = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()
    question_types = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = ['id', 'title', 'file', 'filename', 'file_type', 'extracted_text',
                 'total_pages', 'uploaded_at', 'processed', 'user', 'user_email',
                 'chapters', 'chapter_count', 'question_count', 'question_types']
        read_only_fields = ['id', 'uploaded_at', 'processed', 'user']
        extra_kwargs = {
            'file': {'write_only': True}
        }
    
    def get_filename(self, obj):
        return obj.filename()
    
    def get_chapter_count(self, obj):
        return obj.chapters.count()
    
    def get_question_count(self, obj):
        return obj.questions.count()
    
    def get_question_types(self, obj):
        return obj.questions.values('question_type').distinct().count()

class ExampleSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source='document.title', read_only=True)
    chapter_title = serializers.CharField(source='chapter.title', read_only=True)
    
    class Meta:
        model = Example
        fields = ['id', 'title', 'content', 'page_number', 'document', 
                 'document_title', 'chapter', 'chapter_title', 'related_question']

class TempExamQuestionSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)
    question_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = TempExamQuestion
        fields = ['id', 'question', 'question_id', 'order', 'marks']

class TempExamSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()
    created_by = serializers.CharField(source='user.email', read_only=True)
    question_count = serializers.SerializerMethodField()
    time_remaining = serializers.SerializerMethodField()
    is_expired_status = serializers.SerializerMethodField()
    
    class Meta:
        model = TempExam
        fields = ['id', 'title', 'duration_minutes', 'total_questions', 'total_marks',
                 'selected_chapters', 'chapter_range_text', 'difficulty_breakdown',
                 'type_breakdown', 'created_at', 'expires_at', 'is_active',
                 'questions', 'created_by', 'question_count', 'time_remaining',
                 'is_expired_status']
        read_only_fields = ['id', 'created_at', 'expires_at', 'user']
    
    def get_questions(self, obj):
        """Get all questions linked to this exam"""
        # Use the correct related_name from your model
        # In models.py: related_name='questions'
        temp_questions = obj.questions.all().order_by('order')
        return [
            {
                'id': tq.id,
                'order': tq.order,
                'marks': tq.marks,
                'question': {
                    'id': str(tq.question.id),
                    'text': tq.question.text,
                    'question_type': tq.question.question_type,
                    'difficulty': tq.question.difficulty,
                    'options': tq.question.options,
                    'marks': tq.question.marks,
                    'requires_calculation': tq.question.requires_calculation,
                    'requires_diagram': tq.question.requires_diagram,
                    'formula_needed': tq.question.formula_needed,
                    'hints': tq.question.hints
                }
            }
            for tq in temp_questions
        ]
    
    def get_question_count(self, obj):
        return obj.questions.count()
    
    def get_time_remaining(self, obj):
        if obj.expires_at:
            remaining = obj.expires_at - timezone.now()
            return remaining.total_seconds()
        return None
    
    def get_is_expired_status(self, obj):
        return obj.is_expired

class AnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    question_type = serializers.CharField(source='question.question_type', read_only=True)
    question_marks = serializers.IntegerField(source='question.marks', read_only=True)
    correct_answer = serializers.CharField(source='question.answer', read_only=True)  # ← ADD THIS
    
    class Meta:
        model = Answer
        fields = ['id', 'question', 'question_text', 'question_type', 'question_marks',
                 'answer_text', 'answer_image', 'score', 'feedback', 'graded_at', 'correct_answer']
        read_only_fields = ['id', 'score', 'feedback', 'graded_at']

        
class ExamSubmissionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    exam_title = serializers.CharField(source='temp_exam.title', read_only=True)
    exam_duration = serializers.IntegerField(source='temp_exam.duration_minutes', read_only=True)
    total_questions = serializers.IntegerField(source='temp_exam.total_questions', read_only=True)
    total_possible_marks = serializers.SerializerMethodField()  # ← Use method instead
    completion_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = ExamSubmission
        fields = ['id', 'temp_exam', 'exam_title', 'exam_duration', 'student_name',
                 'student_email', 'started_at', 'submitted_at', 'total_score',
                 'total_questions', 'total_possible_marks', 'graded', 'time_taken_seconds',
                 'answers', 'completion_percentage']
    
    def get_total_possible_marks(self, obj):
        """Get total possible marks from the temp exam"""
        return obj.temp_exam.total_marks
    
    def get_completion_percentage(self, obj):
        """Calculate completion percentage"""
        total = obj.temp_exam.total_marks
        if total and total > 0:
            return (obj.total_score / total) * 100
        return 0
    

class ChapterRangeSerializer(serializers.Serializer):
    """Serializer for chapter range selection"""
    start_chapter = serializers.CharField(required=False, allow_blank=True)
    end_chapter = serializers.CharField(required=False, allow_blank=True)
    chapter_numbers = serializers.ListField(
        child=serializers.CharField(), 
        required=False,
        default=list
    )
    unit_numbers = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    page_range_start = serializers.IntegerField(required=False, allow_null=True)
    page_range_end = serializers.IntegerField(required=False, allow_null=True)

class ExamGenerateSerializer(serializers.Serializer):
    """Serializer for exam generation with chapter selection"""
    document_id = serializers.UUIDField()
    title = serializers.CharField(required=False, allow_blank=True, default="Generated Exam")
    
    # Chapter selection (pick one method)
    chapter_range = serializers.CharField(required=False, allow_blank=True, 
                                         help_text="e.g., '1-5', '1,3,5', 'Unit 1-3'")
    chapter_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list
    )
    page_range = serializers.CharField(required=False, allow_blank=True,
                                      help_text="e.g., '10-25'")
    
    # Question configuration
    total_questions = serializers.IntegerField(min_value=1, max_value=50, default=20)
    
    # Question type distribution
    question_types = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            'MCQ', 'SHORT', 'LONG', 'TRUE_FALSE', 'FILL_BLANK',
            'MATCHING', 'CALCULATION', 'ESSAY', 'DIAGRAM', 'CASE_STUDY',
            'NUMERICAL', 'DERIVATION', 'PROOF', 'ANALYSIS', 'COMPREHENSION'
        ]),
        required=False,
        default=list
    )
    
    # Difficulty distribution
    difficulty_easy_percentage = serializers.IntegerField(min_value=0, max_value=100, default=30)
    difficulty_medium_percentage = serializers.IntegerField(min_value=0, max_value=100, default=50)
    difficulty_hard_percentage = serializers.IntegerField(min_value=0, max_value=100, default=20)
    
    # Topic focus
    topics = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    
    # Auto-calculate duration based on questions
    auto_duration = serializers.BooleanField(default=True)
    custom_duration = serializers.IntegerField(min_value=5, max_value=480, required=False, default=60)
    
    def validate(self, data):
        # Validate that percentages sum to 100
        total = (data['difficulty_easy_percentage'] + 
                data['difficulty_medium_percentage'] + 
                data['difficulty_hard_percentage'])
        if total != 100:
            raise serializers.ValidationError(
                "Difficulty percentages must sum to 100"
            )
        return data

class BulkExtractSerializer(serializers.Serializer):
    """Serializer for bulk question extraction"""
    document_id = serializers.UUIDField()
    extract_chapters = serializers.BooleanField(default=True)
    extract_questions = serializers.BooleanField(default=True)
    extract_examples = serializers.BooleanField(default=True)

class GradeSubmissionSerializer(serializers.Serializer):
    """Serializer for grading submissions"""
    submission_id = serializers.UUIDField()
    auto_grade = serializers.BooleanField(default=True)
