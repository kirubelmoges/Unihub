from django.db import models
from django.conf import settings
import uuid

class Category(models.Model):
    name = models.CharField(max_length=100)
    order = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'marriage_mystery_category'
        ordering = ['order']
        verbose_name_plural = 'Categories'
    
    def __str__(self):
        return self.name


class Question(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    facial_feature = models.CharField(max_length=100, help_text="Maps to facial feature field name")
    order = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'marriage_mystery_question'
        ordering = ['order']
    
    def __str__(self):
        return self.text[:60]


class AnswerOption(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text = models.TextField()
    value = models.IntegerField(help_text="0-100 scale value")
    order = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'marriage_mystery_answer_option'
        ordering = ['order']
    
    def __str__(self):
        return f'{self.question.id} - {self.text[:40]}'


class UserResponse(models.Model):
    session_id = models.UUIDField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(AnswerOption, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'marriage_mystery_user_response'
        unique_together = ['session_id', 'question']
    
    def __str__(self):
        return f"{self.user} - Q{self.question.id}"


class FacialProfile(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_id = models.UUIDField(unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Gender detection
    detected_gender = models.CharField(max_length=1, blank=True, null=True, choices=GENDER_CHOICES)
    gender_confidence = models.FloatField(default=0)
    
    # Geometric features (0-100)
    eye_size = models.FloatField(default=0)
    eyebrow_thickness = models.FloatField(default=0)
    nose_length = models.FloatField(default=0)
    nose_width = models.FloatField(default=0)
    lip_size = models.FloatField(default=0)
    chin_prominence = models.FloatField(default=0)
    face_shape = models.FloatField(default=0)
    facial_fullness = models.FloatField(default=0)
    
    # Color features (0-100)
    skin_tone = models.FloatField(default=0)
    lip_color = models.FloatField(default=0)
    hair_color = models.FloatField(default=0)
    
    # Texture features (0-100)
    forehead_lines = models.FloatField(default=0)
    beard_fullness = models.FloatField(default=0)
    hair_type = models.FloatField(default=0)
    ear_visibility = models.FloatField(default=0)
    
    # Expression features (0-100)
    smile_intensity = models.FloatField(default=0)
    perceived_confidence = models.FloatField(default=0)
    perceived_kindness = models.FloatField(default=0)
    
    # Additional features
    eyebrow_arch = models.FloatField(default=0)
    eye_spacing = models.FloatField(default=0)
    jaw_definition = models.FloatField(default=0)
    
    extraction_successful = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    
    class Meta:
        db_table = 'marriage_mystery_facial_profile'
    
    def to_dict(self):
        return {
            'eye_size': self.eye_size,
            'eyebrow_thickness': self.eyebrow_thickness,
            'nose_length': self.nose_length,
            'nose_width': self.nose_width,
            'lip_size': self.lip_size,
            'chin_prominence': self.chin_prominence,
            'face_shape': self.face_shape,
            'facial_fullness': self.facial_fullness,
            'skin_tone': self.skin_tone,
            'lip_color': self.lip_color,
            'hair_color': self.hair_color,
            'forehead_lines': self.forehead_lines,
            'beard_fullness': self.beard_fullness,
            'hair_type': self.hair_type,
            'ear_visibility': self.ear_visibility,
            'smile_intensity': self.smile_intensity,
            'perceived_confidence': self.perceived_confidence,
            'perceived_kindness': self.perceived_kindness,
            'eyebrow_arch': self.eyebrow_arch,
            'eye_spacing': self.eye_spacing,
            'jaw_definition': self.jaw_definition,
        }


class MatchResult(models.Model):
    VERDICT_MATCH = 'MATCH'
    VERDICT_NO_MATCH = 'NO_MATCH'
    VERDICT_CHOICES = [(VERDICT_MATCH, 'Match'), (VERDICT_NO_MATCH, 'No Match')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='marriage_results')
    session_id = models.UUIDField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Scores
    model_score = models.FloatField()
    chance_score = models.FloatField()
    final_score = models.FloatField()
    verdict = models.CharField(max_length=10, choices=VERDICT_CHOICES)
    is_match = models.BooleanField()
    
    # Gender compatibility
    user_gender = models.CharField(max_length=1, blank=True)
    detected_gender = models.CharField(max_length=1, blank=True)
    same_gender_penalty_applied = models.BooleanField(default=False)
    gender_penalty_amount = models.FloatField(default=0)
    
    # Stored data
    facial_features = models.JSONField(default=dict)
    behavioral_answers = models.JSONField(default=dict)
    feature_alignment = models.JSONField(default=dict)
    cosmic_message = models.TextField(blank=True)
    
    class Meta:
        db_table = 'marriage_mystery_match_result'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.user.email} - {self.verdict} ({self.final_score:.1f}%)'