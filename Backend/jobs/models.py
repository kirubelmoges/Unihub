from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

class Job(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('filled', 'Filled'),
        ('cancelled', 'Cancelled'),
    )
    
    TYPE_CHOICES = (
        ('internship', 'Internship'),
        ('job', 'Job'),
    )
    
    # Use your existing User model
    manager = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_jobs')
    title = models.CharField(max_length=200)
    description = models.TextField()
    requirements = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    location = models.CharField(max_length=200)
    salary_range = models.CharField(max_length=100, blank=True)
    
    # Required documents
    requires_resume = models.BooleanField(default=True)
    requires_essay = models.BooleanField(default=False)
    requires_additional_docs = models.BooleanField(default=False)
    
    # Deadlines
    application_deadline = models.DateTimeField()
    response_deadline_days = models.IntegerField(default=7)  # Days to respond after application
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def is_expired(self):
        return timezone.now() > self.application_deadline
    
    def can_accept_applications(self):
        return self.status == 'active' and not self.is_expired()
    
    def __str__(self):
        return f"{self.title} - {self.manager.username}"