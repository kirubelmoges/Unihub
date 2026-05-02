from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/register/', views.register_view, name='register'),
    path('auth/me/', views.check_auth, name='check_auth'),
    path('auth/csrf/', views.get_csrf_token, name='csrf'),
    
    # Profile endpoints
    path('profile/', views.get_user_profile, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('profile/upload-image/', views.upload_profile_image, name='upload_image'),
    path('profile/change-password/', views.change_password, name='change_password'),
    path('test/auth/', views.test_auth, name='test_auth'),
    path('test/public/', views.test_public, name='test_public'),
    path("api/csrf/", views.csrf),
    path('users/', views.user_list, name='user_list'),
    path('user/<int:user_id>/', views.get_user_by_id, name='user_detail'),
]

