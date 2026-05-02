import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import VideoRoom, RoomParticipant

class VideoConferenceConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for video conferencing"""
    
    async def connect(self):
        self.room_token = self.scope['url_route']['kwargs']['room_token']
        self.room_group_name = f'conference_{self.room_token}'
        self.user = self.scope['user']
        self.session_id = self.channel_name
        
        # Validate room
        self.room = await self.get_room()
        if not self.room:
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Add participant
        await self.add_participant()
        
        # Send room info
        participants = await self.get_participants()
        await self.send(text_data=json.dumps({
            'type': 'room_info',
            'room_token': self.room_token,
            'participants': participants,
            'you': {
                'id': self.session_id,
                'name': await self.get_user_name(),
                'is_authenticated': self.user.is_authenticated
            }
        }))
        
        # Notify others
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined',
                'user': {
                    'id': self.session_id,
                    'name': await self.get_user_name()
                }
            }
        )
    
    async def disconnect(self, close_code):
        # Remove participant
        await self.remove_participant()
        
        # Notify others
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_left',
                    'user_id': self.session_id
                }
            )
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle WebRTC signaling"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type in ['offer', 'answer', 'ice-candidate']:
                # Forward to specific user
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'signal_message',
                        'signal_type': message_type,
                        'data': data['data'],
                        'from_id': self.session_id,
                        'from_name': await self.get_user_name(),
                        'target_id': data.get('target')
                    }
                )
            
            elif message_type == 'screen-offer':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'screen_signal',
                        'signal_type': 'screen-offer',
                        'data': data['data'],
                        'from_id': self.session_id,
                        'target_id': data.get('target')
                    }
                )
            
            elif message_type == 'chat':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': data['message'],
                        'user': {
                            'id': self.session_id,
                            'name': await self.get_user_name()
                        },
                        'timestamp': timezone.now().isoformat()
                    }
                )
            
            elif message_type == 'raise-hand':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'hand_raised',
                        'user': {
                            'id': self.session_id,
                            'name': await self.get_user_name()
                        }
                    }
                )
            
            elif message_type == 'mute-status':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'mute_update',
                        'user_id': self.session_id,
                        'audio_muted': data['audio_muted'],
                        'video_muted': data['video_muted']
                    }
                )
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    # Message handlers
    async def signal_message(self, event):
        """Forward signaling message"""
        if event['target_id'] == self.session_id:
            await self.send(text_data=json.dumps({
                'type': event['signal_type'],
                'data': event['data'],
                'from': {
                    'id': event['from_id'],
                    'name': event['from_name']
                }
            }))
    
    async def screen_signal(self, event):
        """Forward screen sharing signal"""
        if event['target_id'] == self.session_id:
            await self.send(text_data=json.dumps({
                'type': event['signal_type'],
                'data': event['data'],
                'from': event['from_id']
            }))
    
    async def user_joined(self, event):
        """Notify about new user"""
        if event['user']['id'] != self.session_id:
            await self.send(text_data=json.dumps({
                'type': 'user_joined',
                'user': event['user']
            }))
    
    async def user_left(self, event):
        """Notify about user leaving"""
        if event['user_id'] != self.session_id:
            await self.send(text_data=json.dumps({
                'type': 'user_left',
                'user_id': event['user_id']
            }))
    
    async def chat_message(self, event):
        """Broadcast chat message"""
        await self.send(text_data=json.dumps({
            'type': 'chat',
            'message': event['message'],
            'user': event['user'],
            'timestamp': event['timestamp']
        }))
    
    async def hand_raised(self, event):
        """Notify about raised hand"""
        if event['user']['id'] != self.session_id:
            await self.send(text_data=json.dumps({
                'type': 'hand_raised',
                'user': event['user']
            }))
    
    async def mute_update(self, event):
        """Notify about mute status"""
        if event['user_id'] != self.session_id:
            await self.send(text_data=json.dumps({
                'type': 'mute_update',
                'user_id': event['user_id'],
                'audio_muted': event['audio_muted'],
                'video_muted': event['video_muted']
            }))
    
    # Database helpers
    @database_sync_to_async
    def get_room(self):
        try:
            return VideoRoom.objects.get(token=self.room_token, is_active=True)
        except VideoRoom.DoesNotExist:
            return None
    
    @database_sync_to_async
    def add_participant(self):
        RoomParticipant.objects.create(
            room=self.room,
            user=self.user if self.user.is_authenticated else None,
            session_id=self.session_id
        )
    
    @database_sync_to_async
    def remove_participant(self):
        RoomParticipant.objects.filter(
            room=self.room,
            session_id=self.session_id
        ).update(left_at=timezone.now())
    
    @database_sync_to_async
    def get_participants(self):
        participants = RoomParticipant.objects.filter(
            room=self.room,
            left_at__isnull=True
        ).exclude(session_id=self.session_id)
        
        return [{
            'id': p.session_id,
            'name': p.user.get_full_name() or p.user.username if p.user else f"Guest_{p.session_id[:8]}",
            'is_authenticated': p.user is not None
        } for p in participants]
    
    @database_sync_to_async
    def get_user_name(self):
        if self.user.is_authenticated:
            return self.user.get_full_name() or self.user.username
        return f"Guest_{self.session_id[:8]}"