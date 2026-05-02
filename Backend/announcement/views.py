from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Anouncement
from .serializers import AnnouncementSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
# ---------------- ANNOUNCEMENTS ---------------- #

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_announcements(request):
    announcements = Anouncement.objects.all()
    serializer = AnnouncementSerializer(announcements, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_announcement_by_id(request, id):
    announcement = Anouncement.objects.get(id=id)
    serializer = AnnouncementSerializer(announcement)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_announcement_by_name(request, name):
    announcements = Anouncement.objects.filter(AnnouncerName=name)
    serializer = AnnouncementSerializer(announcements, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_announcement(request):
    serializer = AnnouncementSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'status': 'Created', 'data': serializer.data})
    return Response(serializer.errors, status=400)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_announcement(request, id):
    announcement = Anouncement.objects.get(id=id)
    serializer = AnnouncementSerializer(announcement, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_announcement(request, id):
    announcement = Anouncement.objects.get(id=id)
    announcement.delete()
    return Response({'status': 'Deleted'})


