# digital_library/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'books', views.BookViewSet, basename='book')
router.register(r'bookmarks', views.BookmarkViewSet, basename='bookmark')
router.register(r'recent-views', views.RecentViewViewSet, basename='recent-view')
router.register(r'search-history', views.SearchHistoryViewSet, basename='search-history')

urlpatterns = [
    path('', include(router.urls)),
    path('departments/', views.get_departments, name='departments'),
]