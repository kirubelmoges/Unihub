from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import WatchAgain
from .serializers import WatchAgainSerializer, SaveVideoSerializer
import re

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_watch_again(request):
    """Save a video URL to watch again"""
    serializer = SaveVideoSerializer(data=request.data)
    
    if serializer.is_valid():
        video_data = serializer.validated_data['video_url']
        video_url = video_data['url']
        video_id = video_data['video_id']
        
        # Check if already saved
        existing = WatchAgain.objects.filter(
            user=request.user, 
            video_id=video_id
        ).first()
        
        if existing:
            return Response({
                'message': 'Video already in your watch again list',
                'video': WatchAgainSerializer(existing).data
            })
        
        watch_again = WatchAgain.objects.create(
            user=request.user,
            video_url=video_url,
            video_id=video_id
        )
        
        return Response({
            'message': 'Video saved to watch again',
            'video': WatchAgainSerializer(watch_again).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_watch_again(request):
    """Get all saved videos for current user"""
    watch_again = WatchAgain.objects.filter(user=request.user)
    serializer = WatchAgainSerializer(watch_again, many=True)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_watch_again(request, video_id):
    """Remove a video from watch again list"""
    try:
        watch_again = WatchAgain.objects.get(user=request.user, video_id=video_id)
        watch_again.delete()
        return Response({'message': 'Video removed from watch again'})
    except WatchAgain.DoesNotExist:
        return Response({'error': 'Video not found'}, status=status.HTTP_404_NOT_FOUND)
