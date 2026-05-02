from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'id', 'image', 'id_no', 'country', 'university',
            'student_or_instractor', 'department', 'career_year',
            'grad_undergrad', 'description'
        ]
        read_only_fields = ['id']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'profile', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    # Profile fields (optional during registration)
    id_no = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)
    university = serializers.CharField(required=False, allow_blank=True)
    student_or_instractor = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    career_year = serializers.IntegerField(required=False, allow_null=True)
    grad_undergrad = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'username', 'password', 'password2', 'email', 
            'first_name', 'last_name', 'id_no', 'country',
            'university', 'student_or_instractor', 'department',
            'career_year', 'grad_undergrad'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        # Extract profile data
        profile_data = {
            'id_no': validated_data.pop('id_no', ''),
            'country': validated_data.pop('country', ''),
            'university': validated_data.pop('university', ''),
            'student_or_instractor': validated_data.pop('student_or_instractor', ''),
            'department': validated_data.pop('department', ''),
            'career_year': validated_data.pop('career_year', None),
            'grad_undergrad': validated_data.pop('grad_undergrad', ''),
        }
        
        # Remove password2
        validated_data.pop('password2')
        
        # Create user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Update profile with additional data
        for field, value in profile_data.items():
            if value:  # Only set if value exists
                setattr(user.profile, field, value)
        user.profile.save()
        
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs

class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'image', 'id_no', 'country', 'university',
            'student_or_instractor', 'department', 'career_year',
            'grad_undergrad', 'description'
        ]

class UpdateUserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name']