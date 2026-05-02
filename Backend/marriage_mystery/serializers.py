from rest_framework import serializers
from .models import Category, Question, AnswerOption, UserResponse, MatchResult
from django.contrib.auth import get_user_model

User = get_user_model()

class AnswerOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ['id', 'text', 'value', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    options = AnswerOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'facial_feature', 'order', 'options']


class CategorySerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'order', 'questions']


class UserResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserResponse
        fields = ['question', 'selected_option']



    
class SubmitResponsesSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    responses = UserResponseSerializer(many=True)

    def validate_responses(self, value):
        # Now expecting 30 questions (including gender question)
        if len(value) != 30:
            raise serializers.ValidationError(f'Expected 30 responses, got {len(value)}.')
        return value


class MatchResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchResult
        fields = '__all__'