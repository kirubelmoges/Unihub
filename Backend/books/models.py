from django.db import models
from django.contrib.auth.models import User

class SavedBook(models.Model):
    """Model for saving books to read later"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_books')
    book_id = models.CharField(max_length=500)  # Internet Archive identifier
    title = models.CharField(max_length=500)
    author = models.CharField(max_length=300, blank=True)
    embed_url = models.URLField(max_length=1000)
    source_url = models.URLField(max_length=1000)
    thumbnail = models.URLField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    year = models.CharField(max_length=20, blank=True)
    language = models.CharField(max_length=50, blank=True)
    saved_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'book_id']
        ordering = ['-saved_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title[:50]}"
