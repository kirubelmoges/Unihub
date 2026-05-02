from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    repeat_display = serializers.CharField(source='get_repeat_type_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'completed_at', 'alarm_sent', 'alarm_sent_at']

class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'scheduled_date', 'scheduled_time',
            'enable_alarm', 'alarm_minutes_before', 'repeat_type', 'repeat_until',
            'priority', 'category', 'location', 'url'
        ]

class TaskUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'scheduled_date', 'scheduled_time',
            'enable_alarm', 'alarm_minutes_before', 'priority', 'status',
            'category', 'location', 'url'
        ]