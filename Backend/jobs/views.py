from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from .models import Job
from .serializers import JobSerializer, JobCreateSerializer, JobUpdateSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_jobs(request):
    user = request.user
    if hasattr(user, 'profile') and user.profile.student_or_instractor == 'instructor':
        # Instructors/managers see their own jobs
        jobs = Job.objects.filter(manager=user)
    else:
        # Students/applicants see active jobs
        jobs = Job.objects.filter(status='active', application_deadline__gt=timezone.now())
    
    # Annotate with applications count
    jobs = jobs.annotate(applications_count=Count('applications'))
    
    serializer = JobSerializer(jobs, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_job(request):
    # Check if user is instructor/manager
    if not hasattr(request.user, 'profile') or request.user.profile.student_or_instractor != 'instructor':
        return Response({'error': 'Only instructors/managers can post jobs'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    serializer = JobCreateSerializer(data=request.data)
    if serializer.is_valid():
        job = serializer.save(manager=request.user)
        return Response(JobSerializer(job).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_job(request, job_id):
    try:
        job = Job.objects.get(id=job_id)
        user = request.user
        
        # Check access permissions
        if hasattr(user, 'profile') and user.profile.student_or_instractor == 'student':
            if job.status != 'active' or job.is_expired():
                return Response({'error': 'Job not available'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = JobSerializer(job)
        return Response(serializer.data)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_job(request, job_id):
    try:
        job = Job.objects.get(id=job_id, manager=request.user)
        serializer = JobUpdateSerializer(job, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(JobSerializer(job).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_job(request, job_id):
    try:
        job = Job.objects.get(id=job_id, manager=request.user)
        job.delete()
        return Response({'message': 'Job deleted successfully'}, status=status.HTTP_200_OK)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
