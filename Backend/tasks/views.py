from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Task
from .serializers import TaskSerializer, TaskCreateSerializer, TaskUpdateSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tasks(request):
    """Get all tasks for the current user"""
    tasks = Task.objects.filter(user=request.user)
    
    # Filter by status
    status_filter = request.query_params.get('status')
    if status_filter:
        tasks = tasks.filter(status=status_filter)
    
    # Filter by date
    date_filter = request.query_params.get('date')
    if date_filter:
        tasks = tasks.filter(scheduled_date=date_filter)
    
    # Filter by upcoming (next 7 days)
    upcoming = request.query_params.get('upcoming')
    if upcoming == 'true':
        now = timezone.now()
        week_later = now + timezone.timedelta(days=7)
        tasks = tasks.filter(scheduled_datetime__gte=now, scheduled_datetime__lte=week_later, status='pending')
    
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_task(request):
    """Create a new task"""
    serializer = TaskCreateSerializer(data=request.data)
    if serializer.is_valid():
        task = serializer.save(user=request.user)
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_task(request, task_id):
    """Get a single task"""
    try:
        task = Task.objects.get(id=task_id, user=request.user)
        serializer = TaskSerializer(task)
        return Response(serializer.data)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_task(request, task_id):
    """Update a task"""
    try:
        task = Task.objects.get(id=task_id, user=request.user)
        serializer = TaskUpdateSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(TaskSerializer(task).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_task(request, task_id):
    """Delete a task"""
    try:
        task = Task.objects.get(id=task_id, user=request.user)
        task.delete()
        return Response({'message': 'Task deleted successfully'})
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_task(request, task_id):
    """Mark task as completed"""
    try:
        task = Task.objects.get(id=task_id, user=request.user)
        task.complete_task()
        return Response({'message': 'Task completed successfully', 'task': TaskSerializer(task).data})
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def snooze_task(request, task_id):
    """Snooze task for specified minutes"""
    try:
        task = Task.objects.get(id=task_id, user=request.user)
        minutes = request.data.get('minutes', 5)
        
        # Add minutes to scheduled time
        new_datetime = task.scheduled_datetime + timezone.timedelta(minutes=minutes)
        task.scheduled_datetime = new_datetime
        task.scheduled_date = new_datetime.date()
        task.scheduled_time = new_datetime.time()
        task.alarm_sent = False  # Reset alarm
        task.save()
        
        return Response({'message': f'Task snoozed for {minutes} minutes', 'task': TaskSerializer(task).data})
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tasks_for_alarm(request):
    """Get tasks that need alarms (for background checking)"""
    tasks = Task.objects.filter(
        user=request.user,
        enable_alarm=True,
        alarm_sent=False,
        status='pending',
        scheduled_datetime__gte=timezone.now()
    )
    
    alarm_tasks = []
    for task in tasks:
        if task.is_alarm_time():
            alarm_tasks.append(task)
    
    serializer = TaskSerializer(alarm_tasks, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_alarm_sent(request, task_id):
    """Mark alarm as sent for a task"""
    try:
        task = Task.objects.get(id=task_id, user=request.user)
        task.mark_alarm_sent()
        return Response({'message': 'Alarm marked as sent'})
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_today_tasks(request):
    """Get today's tasks"""
    today = timezone.now().date()
    tasks = Task.objects.filter(
        user=request.user,
        scheduled_date=today,
        status='pending'
    ).order_by('scheduled_time')
    
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_upcoming_tasks(request):
    """Get upcoming tasks for the week"""
    now = timezone.now()
    week_later = now + timezone.timedelta(days=7)
    
    tasks = Task.objects.filter(
        user=request.user,
        scheduled_datetime__gte=now,
        scheduled_datetime__lte=week_later,
        status='pending'
    ).order_by('scheduled_datetime')
    
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_overdue_tasks(request):
    """Check and update overdue tasks"""
    tasks = Task.objects.filter(
        user=request.user,
        status='pending',
        scheduled_datetime__lt=timezone.now()
    )
    
    count = tasks.update(status='missed')
    return Response({'message': f'{count} tasks marked as overdue'})
