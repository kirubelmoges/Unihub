from rest_framework import serializers
from .models import Application
from jobs.serializers import JobSerializer
from django.contrib.auth.models import User
from users.serializers import UserSerializer

class ApplicantBasicSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    profile_info = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'profile_info']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username
    
    def get_profile_info(self, obj):
        if hasattr(obj, 'profile'):
            return {
                'university': obj.profile.university,
                'department': obj.profile.department,
                'student_or_instractor': obj.profile.student_or_instractor,
                'grad_undergrad': obj.profile.grad_undergrad
            }
        return None

class ApplicationSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(source='job', read_only=True)
    applicant_details = ApplicantBasicSerializer(source='applicant', read_only=True)
    is_response_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ['applicant', 'status', 'applied_at', 'response_deadline', 
                           'manager_responded_at', 'accepted_at', 'completed_at']

class ApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['job', 'cover_letter', 'resume', 'essay', 'additional_documents',
                 'applicant_email', 'applicant_phone', 'applicant_education', 'applicant_experience']
    
    def validate_job(self, value):
        if not value.can_accept_applications():
            raise serializers.ValidationError("This job is no longer accepting applications")
        return value

class ApplicationResponseSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['accept', 'reject'])
    manager_message = serializers.CharField(required=False, allow_blank=True)

class ApplicationCompleteSerializer(serializers.Serializer):
    pass  # No data needed for completion