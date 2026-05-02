from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_tasks, name='get_tasks'),
    path('create/', views.create_task, name='create_task'),
    path('<int:task_id>/', views.get_task, name='get_task'),
    path('<int:task_id>/update/', views.update_task, name='update_task'),
    path('<int:task_id>/delete/', views.delete_task, name='delete_task'),
    path('<int:task_id>/complete/', views.complete_task, name='complete_task'),
    path('<int:task_id>/snooze/', views.snooze_task, name='snooze_task'),
    path('<int:task_id>/alarm-sent/', views.mark_alarm_sent, name='mark_alarm_sent'),
    path('alarm/check/', views.get_tasks_for_alarm, name='alarm_check'),
    path('today/', views.get_today_tasks, name='today_tasks'),
    path('upcoming/', views.get_upcoming_tasks, name='upcoming_tasks'),
    path('check-overdue/', views.check_overdue_tasks, name='check_overdue'),
]