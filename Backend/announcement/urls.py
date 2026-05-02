from django.urls import path
from . import views

urlpatterns = [
    path('announcements/', views.get_announcements),
    path('announcements/<int:id>/', views.get_announcement_by_id),
    path('announcements/name/<str:name>/', views.get_announcement_by_name),
    path('announcements/create/', views.create_announcement),
    path('announcements/update/<int:id>/', views.update_announcement),
    path('announcements/delete/<int:id>/', views.delete_announcement),
]
