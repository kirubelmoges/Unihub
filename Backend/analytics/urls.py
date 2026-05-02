from django.urls import path
from . import views

urlpatterns = [
    path('analytics/', views.getAnalytics, name='getAnalytics'),
    path('analytics/id/<int:id>/', views.getAnalyticsById, name='getAnalyticsById'),
    path('analytics/subject/<str:subject>/', views.getAnalyticsBySubject, name='getAnalyticsBySubject'),
    path('analytics/create/', views.createAnalytics, name='createAnalytics'),
    path('analytics/update/<int:id>/', views.updateAnalytics, name='updateAnalytics'),
    path('analytics/delete/<int:id>/', views.deleteAnalytics, name='deleteAnalytics'),
]
