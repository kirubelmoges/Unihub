from django.urls import path
from . import views

urlpatterns = [
    path('save/', views.save_watch_again, name='save_watch_again'),
    path('list/', views.get_watch_again, name='get_watch_again'),
    path('remove/<str:video_id>/', views.remove_watch_again, name='remove_watch_again'),
]