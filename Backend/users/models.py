from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone  # Make sure this is imported

class UserProfile(models.Model):
    STUDENT = 'student'
    INSTRUCTOR = 'instructor'
    USER_TYPES = [
        (STUDENT, 'Student'),
        (INSTRUCTOR, 'Instructor'),
    ]
    
    GRAD = 'graduate'
    UNDERGRAD = 'undergraduate'
    STUDY_LEVELS = [
        (GRAD, 'Graduate'),
        (UNDERGRAD, 'Undergraduate'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    image = models.FileField(upload_to='user_images/', blank=True, null=True)
    id_no = models.CharField(max_length=255, blank=True, null=True)
    country = models.CharField(max_length=255, blank=True, null=True)
    university = models.CharField(max_length=255, blank=True, null=True)
    student_or_instractor = models.CharField(max_length=255, blank=True, null=True, choices=USER_TYPES)
    department = models.CharField(max_length=255, blank=True, null=True)
    career_year = models.IntegerField(blank=True, null=True)
    grad_undergrad = models.CharField(max_length=255, blank=True, null=True, choices=STUDY_LEVELS)
    description = models.CharField(max_length=600, blank=True, null=True)
    
    # FIX: Use auto_now_add and auto_now instead of default=timezone.now
          # This updates on every save

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def get_full_name(self):
        return f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """Create or update user profile when User is saved"""
    if created:
        UserProfile.objects.create(user=instance)
    else:
        # FIX: Check if profile exists before saving
        if hasattr(instance, 'profile'):
            instance.profile.save()