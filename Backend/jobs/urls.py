from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_jobs, name='list_jobs'),
    path('create/', views.create_job, name='create_job'),
    path('<int:job_id>/', views.get_job, name='get_job'),
    path('<int:job_id>/update/', views.update_job, name='update_job'),
    path('<int:job_id>/delete/', views.delete_job, name='delete_job'),
]