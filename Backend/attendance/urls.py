from django.urls import path
from . import views

urlpatterns = [
    path('attendance/', views.get_attendance),
    path('attendance/<int:id>/', views.get_attendance_by_id),
    path('attendance/name/<str:name>/', views.get_attendance_by_name),
    path('attendance/create/', views.create_attendance),
    path('attendance/update/<int:id>/', views.update_attendance),
    path('attendance/delete/<int:id>/', views.delete_attendance),
]
