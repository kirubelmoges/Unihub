from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Atendance
from .serializers import AttendanceSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
# ---------------- ATTENDANCE ---------------- #
@permission_classes([IsAuthenticated])
@api_view(['GET'])
def get_attendance(request):
    records = Atendance.objects.all()
    serializer = AttendanceSerializer(records, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_attendance_by_id(request, id):
    record = Atendance.objects.get(id=id)
    serializer = AttendanceSerializer(record)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_attendance_by_name(request, name):
    record = Atendance.objects.get(name=name)
    serializer = AttendanceSerializer(record)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_attendance(request):
    serializer = AttendanceSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'status': 'Created', 'data': serializer.data})
    return Response(serializer.errors, status=400)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_attendance(request, id):
    record = Atendance.objects.get(id=id)
    serializer = AttendanceSerializer(record, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_attendance(request, id):
    record = Atendance.objects.get(id=id)
    record.delete()
    return Response({'status': 'Deleted'})

# Create your views here.
