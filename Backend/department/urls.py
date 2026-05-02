from django.urls import path
from . import views

urlpatterns = [
    # Departement
    path('departments/', views.get_departements),
    path('departments/<int:id>/', views.get_departement_by_id),
    path('departments/create/', views.create_departement),
    path('departments/update/<int:id>/', views.update_departement),
    path('departments/delete/<int:id>/', views.delete_departement),

    # Course
    path('courses/', views.get_courses),
    path('courses/<int:id>/', views.get_course_by_id),
    path('courses/create/', views.create_course),
    path('courses/update/<int:id>/', views.update_course),
    path('courses/delete/<int:id>/', views.delete_course),

    # Class to Enroll
    path('classes/', views.get_classes),
    path('classes/<int:id>/', views.get_class_by_id),
    path('classes/create/', views.create_class),
    path('classes/update/<int:id>/', views.update_class),
    path('classes/delete/<int:id>/', views.delete_class),
]
