from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class ChatRoom(models.Model):
    """Model for chat rooms"""
    ROOM_TYPES = [
        ('group', 'Group Chat'),
        ('private', 'Private Chat'),
        ('channel', 'Channel'),
    ]
    
    PRIVACY_LEVELS = [
        ('public', 'Public - Anyone can join'),
        ('private', 'Private - Approval required'),
        ('hidden', 'Hidden - Invite only'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES, default='group')
    privacy_level = models.CharField(max_length=20, choices=PRIVACY_LEVELS, default='public')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_rooms')
    
   
    participants = models.ManyToManyField(
        User, 
        related_name='chat_rooms', 
        blank=True, 
        through='RoomMembership',
        through_fields=('room', 'user')
    )
    
    is_private = models.BooleanField(default=False)  # For backward compatibility
    invite_code = models.CharField(max_length=20, blank=True, null=True, unique=True)
    
    
    only_owner_can_post = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.get_room_type_display()}: {self.name}"
    
    class Meta:
        ordering = ['-created_at']



class RoomMembership(models.Model):
    """Track membership with roles and status"""
    ROLES = [
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('member', 'Member'),
        ('banned', 'Banned'),
    ]
    
    JOIN_STATUS = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLES, default='member')
    join_status = models.CharField(max_length=20, choices=JOIN_STATUS, default='approved')
    joined_at = models.DateTimeField(auto_now_add=True)
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='invited_users')
    
    class Meta:
        unique_together = ['user', 'room']
        
        indexes = [
            models.Index(fields=['user', 'room']),
            models.Index(fields=['join_status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.room.name} ({self.role})"

class JoinRequest(models.Model):
    """Requests to join private/hidden rooms"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='approved_requests')
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['room', 'is_approved']),
        ]
    
    def __str__(self):
        return f"{self.user.username} wants to join {self.room.name}"

class ChatMessage(models.Model):
    """Model for chat messages"""
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('file', 'File'),
        ('image', 'Image'),
    ]
    
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    content = models.TextField(blank=True)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    
    
    file = models.FileField(upload_to='chat_files/%Y/%m/%d/', blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True)
   
    file_size = models.BigIntegerField(blank=True, null=True)  
    file_content_type = models.CharField(max_length=100, blank=True)
    
    timestamp = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['room', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
        ]
    
    def __str__(self):
        if self.message_type == 'text':
            return f"{self.user.username}: {self.content[:50]}"
        else:
            return f"{self.user.username}: [{self.message_type}] {self.file_name}"
