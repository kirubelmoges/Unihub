from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid
import os
from datetime import timedelta

def document_upload_path(instance, filename):
    """Generate upload path for documents"""
    return f'exam_ai/documents/{instance.user.id}/{filename}'

def answer_image_upload_path(instance, filename):
    """Generate upload path for answer images"""
    return f'exam_ai/answers/{instance.submission.id}/{filename}'

class Document(models.Model):
    DOCUMENT_TYPES = [
        ('PDF', 'PDF File'),
        ('DOCX', 'Word Document'),
        ('TXT', 'Text File'),
        ('JPG', 'JPEG Image'),
        ('PNG', 'PNG Image'),
        ('GIF', 'GIF Image'),
        ('BMP', 'BMP Image'),
        ('TIFF', 'TIFF Image'),
        ('WEBP', 'WebP Image'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exam_documents')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to=document_upload_path)
    file_type = models.CharField(max_length=4, choices=DOCUMENT_TYPES)
    extracted_text = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)
    total_pages = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-uploaded_at']
        db_table = 'exam_ai_documents'
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    def filename(self):
        return os.path.basename(self.file.name)

class Chapter(models.Model):
    """Extracted Chapters/Units/Lessons from documents"""
    CHAPTER_TYPES = [
        ('UNIT', 'Unit'),
        ('CHAPTER', 'Chapter'),
        ('LESSON', 'Lesson'),
        ('SECTION', 'Section'),
        ('PART', 'Part'),
        ('MODULE', 'Module'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chapters')
    title = models.CharField(max_length=500)
    chapter_type = models.CharField(max_length=10, choices=CHAPTER_TYPES, default='CHAPTER')
    chapter_number = models.CharField(max_length=50, blank=True)
    start_page = models.IntegerField(null=True, blank=True)
    end_page = models.IntegerField(null=True, blank=True)
    start_line = models.IntegerField(null=True, blank=True)
    end_line = models.IntegerField(null=True, blank=True)
    content_preview = models.TextField(blank=True)
    full_content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['chapter_number', 'start_page']
        db_table = 'exam_ai_chapters'
        indexes = [
            models.Index(fields=['document', 'chapter_number']),
            models.Index(fields=['start_page', 'end_page']),
        ]
    
    def __str__(self):
        return f"{self.get_chapter_type_display()} {self.chapter_number}: {self.title}"

class Question(models.Model):
    """Extracted Questions"""
    DIFFICULTY_LEVELS = [
        ('EASY', 'Easy'),
        ('MEDIUM', 'Medium'),
        ('HARD', 'Hard'),
    ]
    
    QUESTION_TYPES = [
        ('MCQ', 'Multiple Choice'),
        ('SHORT', 'Short Answer'),
        ('LONG', 'Long Answer'),
        ('TRUE_FALSE', 'True/False'),
        ('FILL_BLANK', 'Fill in the Blank'),
        ('MATCHING', 'Matching'),
        ('CALCULATION', 'Calculation'),
        ('ESSAY', 'Essay'),
        ('DIAGRAM', 'Diagram Based'),
        ('CASE_STUDY', 'Case Study'),
        ('NUMERICAL', 'Numerical Problem'),
        ('DERIVATION', 'Derivation'),
        ('PROOF', 'Proof'),
        ('ANALYSIS', 'Analysis'),
        ('COMPREHENSION', 'Comprehension'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='questions')
    chapter = models.ForeignKey(Chapter, on_delete=models.SET_NULL, null=True, blank=True, related_name='questions')
    text = models.TextField()
    answer = models.TextField()
    question_type = models.CharField(max_length=15, choices=QUESTION_TYPES, default='SHORT')
    difficulty = models.CharField(max_length=6, choices=DIFFICULTY_LEVELS, default='MEDIUM')
    options = models.JSONField(null=True, blank=True)  # For MCQ options
    topic = models.CharField(max_length=100, blank=True)
    subtopic = models.CharField(max_length=100, blank=True)
    page_number = models.IntegerField(null=True, blank=True)
    line_number = models.IntegerField(null=True, blank=True)
    time_estimate_seconds = models.IntegerField(default=60)
    marks = models.IntegerField(default=10)
    requires_calculation = models.BooleanField(default=False)
    requires_diagram = models.BooleanField(default=False)
    formula_needed = models.TextField(blank=True)
    hints = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['chapter', 'page_number', 'created_at']
        db_table = 'exam_ai_questions'
        indexes = [
            models.Index(fields=['document', 'chapter']),
            models.Index(fields=['question_type', 'difficulty']),
            models.Index(fields=['topic']),
        ]
    
    def __str__(self):
        return f"{self.question_type}: {self.text[:50]}..."
    
    def get_time_estimate(self):
        """Get time estimate in minutes based on difficulty and type"""
        base_times = {
            'MCQ': 30,
            'SHORT': 60,
            'LONG': 180,
            'TRUE_FALSE': 20,
            'FILL_BLANK': 40,
            'MATCHING': 90,
            'CALCULATION': 300,
            'ESSAY': 600,
            'DIAGRAM': 480,
            'CASE_STUDY': 900,
            'NUMERICAL': 240,
            'DERIVATION': 360,
            'PROOF': 480,
            'ANALYSIS': 420,
            'COMPREHENSION': 300,
        }
        
        difficulty_multipliers = {
            'EASY': 1,
            'MEDIUM': 1.5,
            'HARD': 2,
        }
        
        base = base_times.get(self.question_type, 60)
        multiplier = difficulty_multipliers.get(self.difficulty, 1)
        return int(base * multiplier)

class Example(models.Model):
    """Extracted Examples from Document"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='examples')
    chapter = models.ForeignKey(Chapter, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    page_number = models.IntegerField(null=True, blank=True)
    related_question = models.ForeignKey(Question, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'exam_ai_examples'

class TempExam(models.Model):
    """Temporary Exam that expires after use"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='temp_exams')
    title = models.CharField(max_length=255)
    duration_minutes = models.IntegerField()
    total_questions = models.IntegerField()
    total_marks = models.IntegerField()
    selected_chapters = models.JSONField(default=list)  # Store selected chapter IDs/ranges
    chapter_range_text = models.CharField(max_length=255, blank=True)  # e.g., "Chapters 1-5, Unit 2"
    difficulty_breakdown = models.JSONField(default=dict)  # Store counts per difficulty
    type_breakdown = models.JSONField(default=dict)  # Store counts per question type
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'exam_ai_temp_exams'
        indexes = [
            models.Index(fields=['user', 'expires_at']),
            models.Index(fields=['is_active']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Expire after 24 hours
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def calculate_duration(self):
        """Calculate appropriate duration based on questions"""
        total_seconds = sum(q.question.get_time_estimate() for q in self.questions.all())
        # Add 10% buffer time
        total_seconds = int(total_seconds * 1.1)
        # Convert to minutes, round up
        return (total_seconds + 59) // 60

class TempExamQuestion(models.Model):
    """Questions in temporary exam"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    temp_exam = models.ForeignKey(TempExam, on_delete=models.CASCADE, related_name='questions')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    order = models.IntegerField()
    marks = models.IntegerField(default=10)
    
    class Meta:
        ordering = ['order']
        unique_together = ['temp_exam', 'question']
        db_table = 'exam_ai_temp_exam_questions'
        indexes = [
            models.Index(fields=['temp_exam', 'order']),
        ]

class ExamSubmission(models.Model):
    """Student Exam Submissions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    temp_exam = models.ForeignKey(TempExam, on_delete=models.CASCADE, related_name='submissions')
    student_name = models.CharField(max_length=255)
    student_email = models.EmailField()
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    total_score = models.FloatField(null=True, blank=True)
    graded = models.BooleanField(default=False)
    time_taken_seconds = models.IntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['-started_at']
        db_table = 'exam_ai_submissions'
        indexes = [
            models.Index(fields=['temp_exam', 'student_email']),
            models.Index(fields=['graded']),
        ]
    
    @property
    def is_completed(self):
        return self.submitted_at is not None

class Answer(models.Model):
    """Individual Answers to Questions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.ForeignKey(ExamSubmission, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='exam_answers')
    answer_text = models.TextField(blank=True)
    answer_image = models.ImageField(upload_to=answer_image_upload_path, null=True, blank=True)
    score = models.FloatField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['submission', 'question']
        db_table = 'exam_ai_answers'
        indexes = [
            models.Index(fields=['submission', 'graded_at']),
        ]

# Cleanup job to remove expired exams
def cleanup_expired_exams():
    """Delete expired temp exams and related data"""
    expired_exams = TempExam.objects.filter(expires_at__lt=timezone.now())
    count = expired_exams.count()
    expired_exams.delete()
    return f"Deleted {count} expired exams"
