# digital_library/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class Faculty(models.Model):
    """Faculty or School"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, default='📚')
    color = models.CharField(max_length=50, default='blue')
    cover_image = models.URLField(max_length=500, blank=True)
    logo = models.URLField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Faculty"
        verbose_name_plural = "Faculties"
        ordering = ['display_order', 'name']
    
    def __str__(self):
        return self.name

class Department(models.Model):
    """Department within a Faculty"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, default='📖')
    search_subjects = models.TextField(help_text="Comma-separated subject terms for DOAB API")
    default_limit = models.IntegerField(default=20)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Department"
        verbose_name_plural = "Departments"
        ordering = ['faculty', 'display_order', 'name']
        unique_together = [['faculty', 'code']]
    
    def __str__(self):
        return f"{self.faculty.name} - {self.name}"
    
    def get_search_subjects_list(self):
        """Return search subjects as list"""
        return [s.strip() for s in self.search_subjects.split(',') if s.strip()]

class Book(models.Model):
    """Book from DOAB with caching"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Identifiers
    doab_id = models.CharField(max_length=100, unique=True, db_index=True)
    handle = models.CharField(max_length=200, blank=True)
    
    # Basic Info
    title = models.CharField(max_length=500, db_index=True)
    subtitle = models.CharField(max_length=500, blank=True)
    authors = models.JSONField(default=list)
    
    # Classification
    subjects = models.JSONField(default=list)
    departments = models.ManyToManyField(Department, related_name='books', blank=True)
    
    # Publication
    publisher = models.CharField(max_length=300, blank=True, db_index=True)
    publication_date = models.CharField(max_length=50, blank=True)
    language = models.CharField(max_length=10, default='en', db_index=True)
    
    # Content
    abstract = models.TextField(blank=True)
    table_of_contents = models.TextField(blank=True)
    
    # URLs
    pdf_url = models.URLField(max_length=500, blank=True)
    epub_url = models.URLField(max_length=500, blank=True)
    html_url = models.URLField(max_length=500, blank=True)
    cover_url = models.URLField(max_length=500, blank=True)
    
    # Rights
    license_info = models.CharField(max_length=200, blank=True)
    rights = models.TextField(blank=True)
    
    # Statistics
    is_featured = models.BooleanField(default=False, db_index=True)
    view_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_cached = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-view_count', '-created_at']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['publisher']),
            models.Index(fields=['language']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['-view_count']),
        ]
    
    def __str__(self):
        return self.title[:100]
    
    def get_download_url(self, format='pdf'):
        if format == 'pdf' and self.pdf_url:
            return self.pdf_url
        elif format == 'epub' and self.epub_url:
            return self.epub_url
        return None
    
    @property
    def all_authors(self):
        if isinstance(self.authors, list):
            return ', '.join(self.authors[:3])
        return self.authors or 'Unknown Author'
    
    @property
    def publication_year(self):
        if self.publication_date:
            return self.publication_date[:4]
        return None
    
    def increment_view_count(self):
        self.view_count += 1
        self.save(update_fields=['view_count'])

class Bookmark(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookmarks')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='bookmarked_by')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'book']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.book.title[:50]}"

class RecentView(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recent_views')
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'book']
        ordering = ['-viewed_at']
    
    def __str__(self):
        return f"{self.user.username} viewed {self.book.title[:50]}"

class SearchHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='searches', null=True, blank=True)
    query = models.CharField(max_length=500, db_index=True)
    result_count = models.IntegerField(default=0)
    searched_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-searched_at']
    
    def __str__(self):
        user_name = self.user.username if self.user else 'Anonymous'
        return f"{user_name}: {self.query[:50]}"