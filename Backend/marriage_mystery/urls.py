from django.urls import path
from . import views

urlpatterns = [
    path('csrf/', views.CSRFTokenView.as_view(), name='csrf'),
    path('questions/', views.QuestionListView.as_view(), name='questions'),
    path('questions/submit/', views.SubmitResponsesView.as_view(), name='submit_responses'),
    path('facial/upload/', views.PhotoUploadView.as_view(), name='photo_upload'),
    path('compatibility/calculate/', views.CalculateCompatibilityView.as_view(), name='calculate'),
    path('results/<uuid:result_id>/', views.ResultDetailView.as_view(), name='result_detail'),
    path('results/history/', views.ResultHistoryView.as_view(), name='result_history'),
]