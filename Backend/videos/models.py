
from django.db import models
from django.contrib.auth.models import User

class WatchAgain(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watch_again')
    video_url = models.URLField(max_length=500)  # Full YouTube URL
    video_id = models.CharField(max_length=50)  # Extracted video ID
    saved_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'video_id']  # Prevent duplicate saves
        ordering = ['-saved_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.video_id}"