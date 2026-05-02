from django.db import models
from django.contrib.auth.models import User
import secrets
import string

class VideoRoom(models.Model):
    """Model for video conference rooms"""
    token = models.CharField(max_length=8, unique=True, editable=False)
    name = models.CharField(max_length=100, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    def save(self, *args, **kwargs):
        if not self.token:
            self.token = self.generate_token()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_token(length=8):
        """Generate unique room token"""
        alphabet = string.ascii_uppercase + string.digits
        while True:
            token = ''.join(secrets.choice(alphabet) for _ in range(length))
            if not VideoRoom.objects.filter(token=token).exists():
                return token
    
    def __str__(self):
        return f"Room {self.token}"

class RoomParticipant(models.Model):
    """Track participants in rooms"""
    room = models.ForeignKey(VideoRoom, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=100)
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['room', 'session_id']
