import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.utils.decorators import method_decorator

from .models import Category, Question, UserResponse, FacialProfile, MatchResult
from .serializers import (
    CategorySerializer, SubmitResponsesSerializer, MatchResultSerializer
)
from .facial_analyzer import FacialAnalyzer
from .scoring_engine import ScoringEngine


class CSRFTokenView(APIView):
    permission_classes = [AllowAny]
    
    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({'csrfToken': get_token(request)})


class QuestionListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        categories = Category.objects.prefetch_related('questions__options').all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


@method_decorator(csrf_exempt, name='dispatch')
class SubmitResponsesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = SubmitResponsesSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        session_id = serializer.validated_data['session_id']
        responses = serializer.validated_data['responses']
        
        # Delete existing responses
        UserResponse.objects.filter(session_id=session_id, user=request.user).delete()
        
        # Create new responses
        UserResponse.objects.bulk_create([
            UserResponse(
                session_id=session_id,
                user=request.user,
                question_id=r['question'].id,
                selected_option_id=r['selected_option'].id
            ) for r in responses
        ])
        
        return Response({'status': 'ok', 'session_id': str(session_id)}, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class PhotoUploadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        photo = request.FILES.get('photo')
        session_id = request.data.get('session_id')
        
        if not photo:
            return Response({'error': 'No photo provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        if photo.size > 10 * 1024 * 1024:
            return Response({'error': 'File too large (max 10MB)'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate extension
        allowed_extensions = ['jpg', 'jpeg', 'png', 'webp']
        ext = photo.name.split('.')[-1].lower()
        if ext not in allowed_extensions:
            return Response({'error': 'Invalid file type'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file signature
        photo.seek(0)
        header = photo.read(12)
        photo.seek(0)
        
        valid = (
            header.startswith(b'\xff\xd8\xff') or
            header.startswith(b'\x89PNG\r\n\x1a\n') or
            (header.startswith(b'RIFF') and b'WEBP' in header)
        )
        
        if not valid:
            return Response({'error': 'Invalid image file'}, status=status.HTTP_400_BAD_REQUEST)
        
        analyzer = FacialAnalyzer()
        features, detected_gender, confidence, error = analyzer.analyze(photo, str(session_id))
        
        if error:
            return Response({'error': error}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        
        FacialProfile.objects.filter(session_id=session_id).delete()
        
        profile = FacialProfile.objects.create(
            session_id=session_id,
            user=request.user,
            detected_gender=detected_gender,
            gender_confidence=confidence,
            extraction_successful=True,
            **features
        )
        
        return Response({
            'session_id': str(session_id),
            'features': profile.to_dict(),
            'detected_gender': detected_gender,
            'gender_confidence': confidence
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class CalculateCompatibilityView(APIView):
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'session_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        responses = UserResponse.objects.filter(
            session_id=session_id,
            user=request.user
        ).select_related('question', 'selected_option')
        
        if responses.count() != 30:
            return Response({
                'error': f'Incomplete questionnaire. Need 30 responses, got {responses.count()}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            facial_profile = FacialProfile.objects.get(session_id=session_id)
        except FacialProfile.DoesNotExist:
            return Response({
                'error': 'Facial profile not found. Upload photo first.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # ✅ FIX: use detected gender instead of request.user.gender
        user_gender = facial_profile.detected_gender
        
        if not user_gender:
            return Response({
                'error': 'Gender not detected. Please upload a valid photo.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        engine = ScoringEngine()
        result_data = engine.calculate(responses, facial_profile, user_gender)
        
        match_result = MatchResult.objects.create(
            user=request.user,
            session_id=session_id,
            model_score=result_data['model_score'],
            chance_score=result_data['chance_score'],
            final_score=result_data['final_score'],
            verdict=result_data['verdict'],
            is_match=result_data['is_match'],
            user_gender=user_gender,
            detected_gender=result_data.get('detected_gender', ''),
            same_gender_penalty_applied=result_data.get('same_gender_detected', False),
            gender_penalty_amount=result_data.get('gender_penalty', 0),
            facial_features=facial_profile.to_dict(),
            behavioral_answers=result_data.get('behavioral_answers', {}),
            feature_alignment=result_data.get('feature_alignment', {}),
            cosmic_message=result_data.get('cosmic_message', ''),
        )
        
        return Response({
            'result_id': str(match_result.id),
            **result_data
        }, status=status.HTTP_201_CREATED)


class ResultDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, result_id):
        try:
            result = MatchResult.objects.get(id=result_id, user=request.user)
            serializer = MatchResultSerializer(result)
            return Response(serializer.data)
        except MatchResult.DoesNotExist:
            return Response({'error': 'Result not found'}, status=status.HTTP_404_NOT_FOUND)


class ResultHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        results = MatchResult.objects.filter(user=request.user)[:20]
        serializer = MatchResultSerializer(results, many=True)
        return Response(serializer.data)