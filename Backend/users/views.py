from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import (
    UserSerializer, LoginSerializer, RegisterSerializer,
    ChangePasswordSerializer, UpdateProfileSerializer,
    UpdateUserSerializer, UserProfileSerializer
)
from .models import UserProfile

@api_view(['GET'])
def get_csrf_token(request):
    """Get CSRF token for React"""
    return Response({'csrfToken': get_token(request)})

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Handle user login with session creation"""
    serializer = LoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    username = serializer.validated_data['username']
    password = serializer.validated_data['password']
    
    # Try to authenticate with username first, then email
    user = authenticate(request, username=username, password=password)
    
    if not user:
        # Try to find user by email
        try:
            user_obj = User.objects.get(email=username)
            user = authenticate(request, username=user_obj.username, password=password)
        except User.DoesNotExist:
            pass
    
    if user is not None:
        login(request, user)
        return Response({
            'success': True,
            'user': UserSerializer(user).data,
            'message': 'Login successful'
        })
    else:
        return Response(
            {'error': 'Invalid username/email or password'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['POST'])
def logout_view(request):
    """Handle user logout and session destruction"""
    logout(request)
    response = Response({'success': True, 'message': 'Logout successful'})
    response.delete_cookie('sessionid')
    response.delete_cookie('csrftoken')
    return response

@api_view(['GET'])
# REMOVE @permission_classes([IsAuthenticated]) 
# Why? Because if it's there, Django REST Framework returns a 403 
# before your code even runs. We want to return a clean 401.
@permission_classes([AllowAny]) 
def check_auth(request):
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': UserSerializer(request.user).data
        })
    return Response({
        'authenticated': False,
        'user': None
    }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get current user's complete profile"""
    user = request.user
    return Response({
        'user': UserSerializer(user).data,
        'profile': UserProfileSerializer(user.profile).data
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new user with profile"""
    serializer = RegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        # Log the user in after registration
        login(request, user)
        return Response({
            'success': True,
            'user': UserSerializer(user).data,
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    serializer = ChangePasswordSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user = request.user
    
    if not user.check_password(serializer.validated_data['old_password']):
        return Response(
            {'old_password': 'Wrong password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.set_password(serializer.validated_data['new_password'])
    user.save()
    
    # Update session to prevent logout
    from django.contrib.auth import update_session_auth_hash
    update_session_auth_hash(request, user)
    
    return Response({'success': True, 'message': 'Password changed successfully'})

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile information"""
    user = request.user
    
    # Update user basic info
    user_serializer = UpdateUserSerializer(user, data=request.data, partial=True)
    if user_serializer.is_valid():
        user_serializer.save()
    
    # Update profile
    profile_serializer = UpdateProfileSerializer(
        user.profile, 
        data=request.data, 
        partial=True
    )
    
    if profile_serializer.is_valid():
        profile_serializer.save()
        return Response({
            'success': True,
            'user': UserSerializer(user).data,
            'message': 'Profile updated successfully'
        })
    
    return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_image(request):
    """Upload profile image"""
    user = request.user
    
    if 'image' not in request.FILES:
        return Response(
            {'error': 'No image provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.profile.image = request.FILES['image']
    user.profile.save()
    
    return Response({
        'success': True,
        'image_url': user.profile.image.url if user.profile.image else None,
        'message': 'Image uploaded successfully'
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_by_id(request, user_id):
    """Get public user info by ID"""
    try:
        user = User.objects.get(id=user_id)
        return Response({
            'user': UserSerializer(user).data
        })
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_auth(request):
    """Test endpoint to verify authentication is working"""
    return Response({
        'authenticated': True,
        'user': request.user.username,
        'message': 'You are successfully authenticated!',
        'session_key': request.session.session_key,
    })

@api_view(['GET'])
def test_public(request):
    """Public test endpoint"""
    return Response({
        'message': 'This is a public endpoint',
        'authenticated': request.user.is_authenticated,
    })

from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
@api_view(['GET'])
@permission_classes([AllowAny])
def csrf(request):
    """
    This is the best one for React. It ensures the 'csrftoken' 
    cookie is sent to the browser.
    """
    return Response({"detail": "CSRF cookie set"})



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)