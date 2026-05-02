from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Task(models.Model):
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('missed', 'Missed'),
        ('cancelled', 'Cancelled'),
    )
    
    REPEAT_CHOICES = (
        ('none', 'No Repeat'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Date and Time
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    scheduled_datetime = models.DateTimeField()
    
    # Alarm Settings
    enable_alarm = models.BooleanField(default=True)
    alarm_minutes_before = models.IntegerField(default=5)  # Minutes before task
    alarm_sent = models.BooleanField(default=False)
    alarm_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Recurring Tasks
    repeat_type = models.CharField(max_length=20, choices=REPEAT_CHOICES, default='none')
    repeat_until = models.DateField(null=True, blank=True)
    parent_task = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='recurring_instances')
    
    # Priority and Status
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Additional
    category = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=200, blank=True)
    url = models.URLField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['scheduled_datetime']
        indexes = [
            models.Index(fields=['user', 'scheduled_datetime']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['alarm_sent', 'enable_alarm', 'scheduled_datetime']),
        ]
    
    def save(self, *args, **kwargs):
        # Combine date and time into datetime
        if self.scheduled_date and self.scheduled_time:
            self.scheduled_datetime = timezone.make_aware(
                timezone.datetime.combine(self.scheduled_date, self.scheduled_time)
            )
        super().save(*args, **kwargs)
    
    def is_alarm_time(self):
        """Check if it's time to send alarm"""
        if not self.enable_alarm or self.alarm_sent or self.status == 'completed':
            return False
        
        alarm_time = self.scheduled_datetime - timezone.timedelta(minutes=self.alarm_minutes_before)
        now = timezone.now()
        
        # Check if alarm time is now or in the past (within last minute to avoid missing)
        return alarm_time <= now <= self.scheduled_datetime
    
    def is_overdue(self):
        """Check if task is overdue"""
        return self.scheduled_datetime < timezone.now() and self.status == 'pending'
    
    def mark_alarm_sent(self):
        """Mark alarm as sent"""
        self.alarm_sent = True
        self.alarm_sent_at = timezone.now()
        self.save()
    
    def complete_task(self):
        """Mark task as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()
    
    def __str__(self):
        return f"{self.title} - {self.scheduled_datetime}"
