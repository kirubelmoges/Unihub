from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from jobs.models import Job

class Application(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
        ('completed', 'Completed'),
    )
    
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    
    # Application details
    cover_letter = models.TextField()
    resume = models.FileField(upload_to='resumes/')
    essay = models.FileField(upload_to='essays/', null=True, blank=True)
    additional_documents = models.FileField(upload_to='additional_docs/', null=True, blank=True)
    
    # Custom fields (can be pre-filled from UserProfile)
    applicant_email = models.EmailField()
    applicant_phone = models.CharField(max_length=20, blank=True)
    applicant_education = models.TextField(blank=True)
    applicant_experience = models.TextField(blank=True)
    
    # Status and deadlines
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    applied_at = models.DateTimeField(auto_now_add=True)
    
    # Manager response deadline
    response_deadline = models.DateTimeField()
    manager_responded_at = models.DateTimeField(null=True, blank=True)
    
    # Acceptance tracking
    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Manager's message (for acceptance letter)
    manager_message = models.TextField(blank=True, help_text="Message to send with acceptance")
    
    def save(self, *args, **kwargs):
        if not self.response_deadline:
            # Set response deadline based on job's response_deadline_days
            self.response_deadline = self.applied_at + timedelta(days=self.job.response_deadline_days)
        super().save(*args, **kwargs)
    
    def is_response_expired(self):
        return timezone.now() > self.response_deadline and self.status == 'pending'
    
    def accept_application(self, manager_message=""):
        self.status = 'accepted'
        self.accepted_at = timezone.now()
        self.manager_responded_at = timezone.now()
        if manager_message:
            self.manager_message = manager_message
        self.save()
    
    def complete_application(self):
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()
    
    def reject_application(self):
        self.status = 'rejected'
        self.manager_responded_at = timezone.now()
        self.save()
    
    def __str__(self):
        return f"{self.applicant.username} - {self.job.title}"