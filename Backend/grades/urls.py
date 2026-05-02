from django.urls import path
from . import views

urlpatterns = [
    path('grades/', views.get_grades),
    path('grades/<int:id>/', views.get_grade_by_id),
    path('grades/student/<str:id_no>/', views.get_grade_by_student),
    path('grades/create/', views.create_grade),
    path('grades/update/<int:id>/', views.update_grade),
    path('grades/delete/<int:id>/', views.delete_grade),
]
