import io
from django.urls import reverse
from django.contrib.auth import get_user_model # Correct way to get User
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch
from .models import Document # Import your models here

User = get_user_model()

class ExamExtractionTests(APITestCase):
    def setUp(self):
        # Create user
        self.user = User.objects.create_user(username='kirubel', password='testpassword123')
        self.client.force_authenticate(user=self.user)
        
        # Create a dummy document so the 'process' action has an ID to work with
        self.document = Document.objects.create(
            user=self.user,
            title="General Quiz",
            file_type="DOCX",
            file="temp_test.docx" 
        )
    
    # ... rest of the test code ...

    @patch('exam_ai.utils.question_extractor.QuestionExtractor.extract_questions')
    @patch('exam_ai.utils.chapter_extractor.ChapterExtractor.extract_chapters')
    def test_upload_and_extract_flow(self, mock_chapters, mock_questions):
        """Test the 'process' action in DocumentViewSet."""
        
        # Mocking the chapter extraction
        mock_chapters.return_value = [
            {'title': 'Chapter 1', 'type': 'Normal', 'number': '1', 'content': 'Full content'}
        ]
        
        # Mocking the AI question extraction
        mock_questions.return_value = [
            {
                'type': 'question', 
                'text': 'What is 2+2?', 
                'question_type': 'MCQ', 
                'options': ['3', '4'], 
                'answer': '4',
                'difficulty': 'EASY'
            }
        ]

        # Use the correct URL name: 'document-process'
        # Since it is a 'detail=True' action, we must pass the pk
        url = reverse('document-process', kwargs={'pk': self.document.pk})
        
        # Trigger the process action
        response = self.client.post(url)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['questions_count'], 1)
        self.assertEqual(response.data['message'], 'Document processed successfully')
        
        print("✔ Extraction Logic Verified via 'document-process' endpoint.")