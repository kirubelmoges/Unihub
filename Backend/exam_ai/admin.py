from django.contrib import admin
from .models import *

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'file_type', 'total_pages', 'uploaded_at', 'processed']
    list_filter = ['file_type', 'processed', 'uploaded_at']
    search_fields = ['title', 'user__email']
    readonly_fields = ['id', 'uploaded_at']
    list_per_page = 25

@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ['title', 'chapter_type', 'chapter_number', 'document', 
                   'start_page', 'end_page', 'created_at']
    list_filter = ['chapter_type', 'created_at']
    search_fields = ['title', 'chapter_number', 'document__title']
    readonly_fields = ['id', 'created_at']

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['text_preview', 'question_type', 'difficulty', 'marks',
                   'chapter', 'page_number', 'created_at']
    list_filter = ['question_type', 'difficulty', 'requires_calculation', 'created_at']
    search_fields = ['text', 'answer', 'topic']
    readonly_fields = ['id', 'created_at']
    list_per_page = 50
    
    def text_preview(self, obj):
        return obj.text[:75] + '...' if len(obj.text) > 75 else obj.text
    text_preview.short_description = 'Question'

@admin.register(Example)
class ExampleAdmin(admin.ModelAdmin):
    list_display = ['title', 'document', 'chapter', 'page_number', 'created_at']
    list_filter = ['created_at']
    search_fields = ['title', 'content']

@admin.register(TempExam)
class TempExamAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'total_questions', 'duration_minutes', 
                   'created_at', 'expires_at', 'is_active']
    list_filter = ['is_active', 'created_at', 'expires_at']
    search_fields = ['title', 'user__email']
    readonly_fields = ['id', 'created_at', 'expires_at']
    
    def is_active(self, obj):
        return not obj.is_expired
    is_active.boolean = True
    is_active.short_description = 'Active'

@admin.register(TempExamQuestion)
class TempExamQuestionAdmin(admin.ModelAdmin):
    list_display = ['temp_exam', 'question', 'order', 'marks']
    list_filter = ['temp_exam']
    search_fields = ['temp_exam__title', 'question__text']

@admin.register(ExamSubmission)
class ExamSubmissionAdmin(admin.ModelAdmin):
    list_display = ['temp_exam', 'student_name', 'student_email', 
                   'started_at', 'submitted_at', 'total_score', 'graded']
    list_filter = ['graded', 'started_at']
    search_fields = ['student_name', 'student_email']
    readonly_fields = ['id', 'started_at']

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['submission', 'question', 'score', 'graded_at']
    list_filter = ['graded_at']
    search_fields = ['answer_text', 'feedback']
    readonly_fields = ['id', 'graded_at']
