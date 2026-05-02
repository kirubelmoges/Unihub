import json
import re
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.contrib.auth.models import User
from datetime import datetime
from .models import ChatRoom, ChatMessage, RoomMembership
from users.models import UserProfile

def sanitize_group_name(name):
    """Convert any string to a valid channel layer group name"""
    if not isinstance(name, str):
        name = str(name)
    sanitized = re.sub(r'[^a-zA-Z0-9_.-]', '_', name)
    if not sanitized:
        sanitized = "default"
    if len(sanitized) > 90:
        sanitized = sanitized[:90]
    return sanitized

class ChatConsumer(AsyncWebsocketConsumer):
    """
    Complete chat consumer with session-based authentication
    """
    async def connect(self):
        self.raw_room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_name = self.raw_room_name
        safe_room_name = sanitize_group_name(self.raw_room_name)
        self.room_group_name = f'chat_{safe_room_name}'
        self.user = self.scope['user']
        
        print(f"🔌 WebSocket connection attempt for room: {self.room_name}")
        print(f"👤 User: {self.user}")
        print(f"🔑 Is authenticated: {self.user.is_authenticated}")
        
        if not self.user.is_authenticated:
            print("❌ User is not authenticated - closing connection")
            await self.close()
            return
        
        # Check if user is member of this room
        self.room = await self.get_room()
        if not self.room:
            print("❌ Room does not exist")
            await self.close()
            return
        
        is_member = await self.check_membership()
        if not is_member:
            print("❌ User is not a member of this room")
            await self.close()
            return
        
        
        can_post = await self.check_can_post()
        self.user_can_post = can_post
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        
        recent_messages = await self.get_recent_messages()
        await self.send(text_data=json.dumps({
            'type': 'recent_messages',
            'messages': recent_messages
        }))
        
        
        user_profile = await self.get_user_profile(self.user)
        
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_system_message',
                'message': f"{self.get_display_name(self.user, user_profile)} joined the chat",
                'timestamp': self.get_timestamp(),
                'user_id': self.user.id,
                'username': self.user.username,
                'full_name': user_profile.get('full_name') if user_profile else self.user.username,
                'profile_image': user_profile.get('profile_image') if user_profile else None
            }
        )
        
        
        await self.update_participants_list()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name') and hasattr(self, 'user') and self.user.is_authenticated:
            user_profile = await self.get_user_profile(self.user)
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_system_message',
                    'message': f"{self.get_display_name(self.user, user_profile)} left the chat",
                    'timestamp': self.get_timestamp(),
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'full_name': user_profile.get('full_name') if user_profile else self.user.username,
                    'profile_image': user_profile.get('profile_image') if user_profile else None
                }
            )
            
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'chat_message')
        
        # Check if user can send messages
        if message_type in ['chat_message', 'file_message']:
            can_post = await self.check_can_post()
            if not can_post:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'You do not have permission to post in this channel'
                }))
                return
        
        if message_type == 'chat_message':
            message = text_data_json.get('message', '')
            if message.strip():
                saved_message = await self.save_message(message)
                user_profile = await self.get_user_profile(self.user)
                
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message_id': saved_message['id'],
                        'message': message,
                        'username': self.user.username,
                        'full_name': user_profile.get('full_name') if user_profile else self.user.username,
                        'user_id': self.user.id,
                        'profile_image': user_profile.get('profile_image') if user_profile else None,
                        'timestamp': self.get_timestamp()
                    }
                )
        
        elif message_type == 'file_message':
            file_data = text_data_json.get('file_data', {})
            saved_message = await self.save_file_message(file_data)
            user_profile = await self.get_user_profile(self.user)
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'file_message',
                    'message_id': saved_message['id'],
                    'file_url': file_data['file_url'],
                    'file_name': file_data['file_name'],
                    'file_size': file_data['file_size'],
                    'file_type': file_data['file_type'],
                    'username': self.user.username,
                    'full_name': user_profile.get('full_name') if user_profile else self.user.username,
                    'user_id': self.user.id,
                    'profile_image': user_profile.get('profile_image') if user_profile else None,
                    'timestamp': self.get_timestamp()
                }
            )
        
        elif message_type == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_typing',
                    'user': self.user.username,
                    'user_id': self.user.id,
                    'is_typing': text_data_json.get('is_typing', False)
                }
            )
        
        elif message_type == 'mark_read':
            message_id = text_data_json.get('message_id')
            if message_id:
                await self.mark_message_read(message_id)
        
        elif message_type == 'get_participants':
            await self.send_participants_list()
    
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'id': event['message_id'],
            'message': event['message'],
            'username': event['username'],
            'full_name': event.get('full_name', event['username']),
            'user_id': event['user_id'],
            'profile_image': event.get('profile_image'),
            'timestamp': event['timestamp']
        }))
    
    async def file_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'file_message',
            'id': event['message_id'],
            'file_url': event['file_url'],
            'file_name': event['file_name'],
            'file_size': event['file_size'],
            'file_type': event['file_type'],
            'username': event['username'],
            'full_name': event.get('full_name', event['username']),
            'user_id': event['user_id'],
            'profile_image': event.get('profile_image'),
            'timestamp': event['timestamp']
        }))
    
    async def chat_system_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'system_message',
            'message': event['message'],
            'timestamp': event['timestamp'],
            'user_id': event.get('user_id'),
            'username': event.get('username'),
            'full_name': event.get('full_name'),
            'profile_image': event.get('profile_image')
        }))
    
    async def user_typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing_indicator',
            'user': event['user'],
            'user_id': event['user_id'],
            'is_typing': event['is_typing']
        }))
    
    async def participants_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'participants_update',
            'participants': event['participants'],
            'count': event['count']
        }))
    
    @database_sync_to_async
    def get_room(self):
        try:
            return ChatRoom.objects.get(name=self.room_name)
        except ChatRoom.DoesNotExist:
            return None
    
    @database_sync_to_async
    def check_membership(self):
        return RoomMembership.objects.filter(
            user=self.user,
            room=self.room,
            join_status='approved'
        ).exists()
    
    @database_sync_to_async
    def check_can_post(self):
        if self.room.room_type == 'channel' and self.room.only_owner_can_post:
            membership = RoomMembership.objects.filter(
                user=self.user,
                room=self.room
            ).first()
            return membership and membership.role == 'owner'
        return True
    
    @database_sync_to_async
    def get_recent_messages(self, limit=50):
        messages = ChatMessage.objects.filter(
            room=self.room
        ).select_related('user', 'user__profile').order_by('-timestamp')[:limit]
        
        result = []
        for msg in reversed(messages):
            profile = getattr(msg.user, 'profile', None)
            result.append({
                'id': msg.id,
                'message': msg.content if msg.message_type == 'text' else f'[{msg.message_type}] {msg.file_name}',
                'username': msg.user.username,
                'full_name': profile.get_full_name() if profile else msg.user.username,
                'user_id': msg.user.id,
                'profile_image': profile.get_profile_image_url() if profile and profile.image else None,
                'timestamp': msg.timestamp.isoformat(),
                'is_read': msg.is_read,
                'message_type': msg.message_type,
                'file_url': msg.file.url if msg.file else None,
                'file_name': msg.file_name,
                'file_size': msg.file_size
            })
        return result
    
    @database_sync_to_async
    def save_message(self, message):
        chat_message = ChatMessage.objects.create(
            room=self.room,
            user=self.user,
            content=message,
            message_type='text'
        )
        return {'id': chat_message.id}
    
    @database_sync_to_async
    def save_file_message(self, file_data):
        chat_message = ChatMessage.objects.create(
            room=self.room,
            user=self.user,
            content=f"[File] {file_data['file_name']}",
            message_type='file',
            file_name=file_data['file_name'],
            file_size=file_data['file_size'],
            file_content_type=file_data['file_type']
        )
        return {'id': chat_message.id}
    
    @database_sync_to_async
    def mark_message_read(self, message_id):
        ChatMessage.objects.filter(
            id=message_id,
            room=self.room
        ).exclude(user=self.user).update(is_read=True)
    
    @database_sync_to_async
    def get_user_profile(self, user):
        try:
            profile = UserProfile.objects.get(user=user)
            return {
                'full_name': profile.get_full_name(),
                'profile_image': profile.get_profile_image_url() if profile.image else None,
                'university': profile.university,
                'department': profile.department,
                'student_or_instractor': profile.student_or_instractor
            }
        except UserProfile.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_participants(self):
        participants = self.room.participants.filter(
            roommembership__join_status='approved'
        ).select_related('profile')
        
        result = []
        for user in participants:
            profile = getattr(user, 'profile', None)
            membership = RoomMembership.objects.filter(user=user, room=self.room).first()
            result.append({
                'id': user.id,
                'username': user.username,
                'full_name': profile.get_full_name() if profile else user.username,
                'profile_image': profile.get_profile_image_url() if profile and profile.image else None,
                'role': membership.role if membership else 'member',
                'is_online': True
            })
        return result
    
    async def update_participants_list(self):
        participants = await self.get_participants()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'participants_update',
                'participants': participants,
                'count': len(participants)
            }
        )
    
    async def send_participants_list(self):
        participants = await self.get_participants()
        await self.send(text_data=json.dumps({
            'type': 'participants_update',
            'participants': participants,
            'count': len(participants)
        }))
    
    def get_display_name(self, user, profile=None):
        if profile and profile.get('full_name'):
            return profile['full_name']
        return user.get_full_name() or user.username
    
    def get_timestamp(self):
        return datetime.now().isoformat()