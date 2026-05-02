from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.search_books, name='search_books'),
    path('book/<str:book_id>/', views.get_book_by_id, name='get_book'),
    path('save-for-later/', views.save_for_later, name='save_for_later'),
    path('read-later/', views.get_read_later, name='get_read_later'),
    path('remove/<str:book_id>/', views.remove_from_read_later, name='remove_from_read_later'),
]