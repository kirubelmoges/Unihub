from django.urls import path
from . import views

urlpatterns = [
    path('apply/', views.apply_for_job, name='apply'),
    path('my-applications/', views.my_applications, name='my_applications'),
    path('job/<int:job_id>/', views.job_applications, name='job_applications'),
    path('<int:application_id>/', views.get_application, name='get_application'),
    path('<int:application_id>/respond/', views.respond_to_application, name='respond'),
    path('<int:application_id>/complete/', views.complete_application, name='complete'),
]