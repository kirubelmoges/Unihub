from django.db import models
from django.contrib.auth.models import User

class SavedContent(models.Model):
    SOURCE_CHOICES = (
        ('oer', 'OER Commons'),
        ('mit', 'MIT OpenCourseWare'),
        ('other', 'Other'),
    )
    
    CONTENT_TYPES = (
        ('presentation', 'PowerPoint'),
        ('lecture', 'Lecture Notes'),
        ('video', 'Video Lecture'),
        ('pdf', 'PDF Document'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_educational_content')
    content_id = models.CharField(max_length=500)
    title = models.CharField(max_length=500)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES, default='presentation')
    embed_url = models.URLField(max_length=1000)
    source_url = models.URLField(max_length=1000)
    thumbnail = models.URLField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    author = models.CharField(max_length=200, blank=True)
    course_code = models.CharField(max_length=100, blank=True)
    saved_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'content_id']
        ordering = ['-saved_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
