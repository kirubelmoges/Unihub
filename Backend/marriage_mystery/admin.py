from django.contrib import admin
from .models import Category, Question, AnswerOption, UserResponse, FacialProfile, MatchResult

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'order']
    ordering = ['order']

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'category', 'facial_feature', 'order']
    list_filter = ['category']
    search_fields = ['text']

@admin.register(AnswerOption)
class AnswerOptionAdmin(admin.ModelAdmin):
    list_display = ['question', 'text', 'value', 'order']
    list_filter = ['question__category']

@admin.register(UserResponse)
class UserResponseAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'question', 'created_at']
    list_filter = ['created_at']
    raw_id_fields = ['user', 'question', 'selected_option']

@admin.register(FacialProfile)
class FacialProfileAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'detected_gender', 'extraction_successful', 'created_at']
    list_filter = ['detected_gender', 'extraction_successful', 'created_at']
    readonly_fields = ['id', 'created_at']

@admin.register(MatchResult)
class MatchResultAdmin(admin.ModelAdmin):
    list_display = ['user', 'final_score', 'verdict', 'is_match', 'created_at']
    list_filter = ['verdict', 'is_match', 'same_gender_penalty_applied', 'created_at']
    readonly_fields = ['id', 'created_at']