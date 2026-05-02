from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'documents', views.DocumentViewSet, basename='document')
router.register(r'exam-generation', views.ExamGenerationViewSet, basename='exam-generation')
router.register(r'temp-exams', views.TempExamViewSet, basename='temp-exam')
router.register(r'grading', views.GradingViewSet, basename='grading')
router.register(r'submissions', views.SubmissionViewSet, basename='submission')

urlpatterns = [
    path('csrf/', views.get_csrf_token, name='csrf'),
    path('', include(router.urls)),
]