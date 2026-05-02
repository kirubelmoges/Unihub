from django.urls import path
from . import views

urlpatterns = [
    # Search endpoints
    path('search/', views.search_all, name='search_all'),
    path('search/oer/', views.search_oer_commons, name='search_oer'),
    path('search/mit/', views.search_mit_ocw, name='search_mit'),
    path('featured/', views.get_featured_content, name='featured'),
    
    # Read Later endpoints (main)
    path('save-for-later/', views.save_for_later, name='save_for_later'),
    path('read-later/', views.get_read_later, name='get_read_later'),
    path('remove/<str:content_id>/', views.remove_from_read_later, name='remove_from_read_later'),
    
    # Legacy endpoints (for compatibility)
    path('save/', views.save_content, name='save_content'),
    path('list/', views.get_saved_content, name='get_saved'),
    path('remove-saved/<str:content_id>/', views.remove_saved_content, name='remove_saved'),
]