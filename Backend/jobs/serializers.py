from rest_framework import serializers
from .models import Job
from django.contrib.auth.models import User

class UserBasicSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

class JobSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.username', read_only=True)
    manager_details = UserBasicSerializer(source='manager', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    applications_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ['manager', 'created_at', 'updated_at', 'status']

class JobCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['title', 'description', 'requirements', 'type', 'location', 
                 'salary_range', 'requires_resume', 'requires_essay', 
                 'requires_additional_docs', 'application_deadline', 'response_deadline_days']

class JobUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['title', 'description', 'requirements', 'type', 'location', 
                 'salary_range', 'application_deadline', 'response_deadline_days', 'status']