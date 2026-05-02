from django.urls import path
from . import views

urlpatterns = [
    path('api/rooms/create/', views.create_room, name='create_room'),
    path('api/rooms/join/<str:room_token>/', views.join_room, name='join_room'),
    path('api/rooms/<str:room_token>/', views.get_room, name='get_room'),
]