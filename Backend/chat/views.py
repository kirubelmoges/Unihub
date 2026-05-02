from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import ChatRoom, ChatMessage, RoomMembership, JoinRequest
from .serializers import ChatRoomSerializer, ChatMessageSerializer, JoinRequestSerializer
import uuid
import os

class ChatRoomList(generics.ListAPIView):
    """List only rooms the user is a member of"""
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(
            roommembership__user=user,
            roommembership__join_status='approved',
            roommembership__role__in=['owner', 'admin', 'member']
        ).distinct()

class CreateGroupView(APIView):
    """Create a new group/channel"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        data = request.data
        room_type = data.get('room_type', 'group')
        privacy_level = data.get('privacy_level', 'public')
        only_owner_can_post = data.get('only_owner_can_post', False)
        
        # Generate invite code for private/hidden rooms
        invite_code = None
        if privacy_level in ['private', 'hidden']:
            invite_code = str(uuid.uuid4())[:8].upper()
        
        # Check if room name already exists
        if ChatRoom.objects.filter(name=data['name']).exists():
            return Response({'error': 'Room name already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        room = ChatRoom.objects.create(
            name=data['name'],
            description=data.get('description', ''),
            room_type=room_type,
            privacy_level=privacy_level,
            created_by=request.user,
            only_owner_can_post=only_owner_can_post,
            invite_code=invite_code
        )
        
        # Add creator as owner
        RoomMembership.objects.create(
            user=request.user,
            room=room,
            role='owner',
            join_status='approved'
        )
        
        # Add selected members if any
        member_ids = data.get('members', [])
        for member_id in member_ids:
            if int(member_id) != request.user.id:
                # For private rooms, members need approval
                status_choice = 'pending' if privacy_level == 'private' else 'approved'
                RoomMembership.objects.create(
                    user_id=member_id,
                    room=room,
                    role='member',
                    join_status=status_choice
                )
                
                # Create join request for private rooms
                if privacy_level == 'private':
                    JoinRequest.objects.create(
                        user_id=member_id,
                        room=room,
                        message="Added by creator (pending approval)"
                    )
        
        return Response({
            'success': True,
            'room': ChatRoomSerializer(room, context={'request': request}).data,
            'invite_code': invite_code
        })

class RoomDetailView(APIView):
    """Get room details"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, room_id):
        room = get_object_or_404(ChatRoom, id=room_id)
        
        # Check if user is member
        membership = RoomMembership.objects.filter(
            user=request.user,
            room=room
        ).first()
        
        if not membership or membership.join_status != 'approved':
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ChatRoomSerializer(room, context={'request': request})
        return Response(serializer.data)

class JoinRoomView(APIView):
    """Request to join or join public room"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, room_id):
        room = get_object_or_404(ChatRoom, id=room_id)
        user = request.user
        
        # Check if already a member
        membership = RoomMembership.objects.filter(user=user, room=room).first()
        if membership:
            if membership.join_status == 'approved':
                return Response({'error': 'Already a member'}, status=status.HTTP_400_BAD_REQUEST)
            elif membership.join_status == 'pending':
                return Response({'error': 'Request already pending'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Public rooms - auto approve
        if room.privacy_level == 'public':
            RoomMembership.objects.create(
                user=user,
                room=room,
                role='member',
                join_status='approved'
            )
            return Response({'success': True, 'message': 'Joined room successfully'})
        
        # Private rooms - require approval
        elif room.privacy_level == 'private':
            join_message = request.data.get('message', '')
            RoomMembership.objects.create(
                user=user,
                room=room,
                role='member',
                join_status='pending'
            )
            JoinRequest.objects.create(
                user=user,
                room=room,
                message=join_message
            )
            return Response({'success': True, 'message': 'Join request sent'})
        
        # Hidden rooms - invite only
        else:
            invite_code = request.data.get('invite_code')
            if invite_code and invite_code == room.invite_code:
                RoomMembership.objects.create(
                    user=user,
                    room=room,
                    role='member',
                    join_status='approved'
                )
                return Response({'success': True, 'message': 'Joined room successfully'})
            else:
                return Response({'error': 'Invalid invite code'}, status=status.HTTP_400_BAD_REQUEST)

class LeaveRoomView(APIView):
    """Leave a room"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, room_id):
        room = get_object_or_404(ChatRoom, id=room_id)
        
        membership = RoomMembership.objects.filter(
            user=request.user,
            room=room
        ).first()
        
        if membership:
            if membership.role == 'owner':
                # Check if there are other owners
                other_owners = RoomMembership.objects.filter(
                    room=room,
                    role='owner'
                ).exclude(user=request.user).exists()
                
                if not other_owners:
                    return Response({
                        'error': 'You are the only owner. Transfer ownership before leaving.'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            membership.delete()
            return Response({'success': True, 'message': 'Left room successfully'})
        
        return Response({'error': 'Not a member'}, status=status.HTTP_400_BAD_REQUEST)


class GetMessagesView(APIView):
    """Get messages for a room"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, room_id):
        room = get_object_or_404(ChatRoom, id=room_id)
        
        # Check if user is member
        membership = RoomMembership.objects.filter(
            user=request.user,
            room=room,
            join_status='approved'
        ).exists()
        
        if not membership:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        limit = int(request.GET.get('limit', 50))
        messages = ChatMessage.objects.filter(room=room).select_related('user', 'user__profile').order_by('-timestamp')[:limit]
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data[::-1])  # Return oldest first

class SendMessageView(APIView):
    """Send a message (with permission check for channels)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, room_id):
        room = get_object_or_404(ChatRoom, id=room_id)
        user = request.user
        
        # Check if user is approved member
        membership = RoomMembership.objects.filter(
            user=user,
            room=room,
            join_status='approved'
        ).first()
        
        if not membership:
            return Response({'error': 'Not a member'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check channel posting permission
        if room.room_type == 'channel' and room.only_owner_can_post:
            if membership.role != 'owner':
                return Response({'error': 'Only owner can post in this channel'}, status=status.HTTP_403_FORBIDDEN)
        
        # Create message
        message = ChatMessage.objects.create(
            room=room,
            user=user,
            content=request.data.get('content', ''),
            message_type=request.data.get('message_type', 'text'),
            file_name=request.data.get('file_name'),
            file_size=request.data.get('file_size'),
            file_content_type=request.data.get('file_content_type')
        )
        
        serializer = ChatMessageSerializer(message)
        return Response({
            'success': True,
            'message': serializer.data
        })

import os
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import uuid

class FileUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            file = request.FILES.get('file')
            room_id = request.POST.get('room_id')
            
            if not file:
                return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not room_id:
                return Response({'error': 'No room ID provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user is member of the room
            room = get_object_or_404(ChatRoom, id=room_id)
            membership = RoomMembership.objects.filter(
                user=request.user,
                room=room,
                join_status='approved'
            ).exists()
            
            if not membership:
                return Response({'error': 'Not a member of this room'}, status=status.HTTP_403_FORBIDDEN)
            
            # Check file size (3GB limit)
            MAX_SIZE = 3 * 1024 * 1024 * 1024
            if file.size > MAX_SIZE:
                return Response({
                    'error': f'File size exceeds 3GB limit. Your file is {file.size / (1024 * 1024 * 1024):.2f}GB'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate unique filename to avoid conflicts
            import os
            from datetime import datetime
            
            # Create year/month/day folder structure
            now = datetime.now()
            folder_path = f'chat_files/{now.year}/{now.month:02d}/{now.day:02d}'
            
            # Create full path
            full_folder = os.path.join(settings.MEDIA_ROOT, folder_path)
            os.makedirs(full_folder, exist_ok=True)
            
            # Generate unique filename
            file_extension = os.path.splitext(file.name)[1]
            unique_filename = f"{uuid.uuid4().hex}{file_extension}"
            file_path = os.path.join(full_folder, unique_filename)
            
            # Save the file
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            
            # Create relative URL for database
            file_url = f"{settings.MEDIA_URL}{folder_path}/{unique_filename}"
            
            # Create chat message with file info
            chat_message = ChatMessage.objects.create(
                room=room,
                user=request.user,
                content=f"[File] {file.name}",
                message_type='file',
                file_name=file.name,
                file_size=file.size,
                file_content_type=file.content_type
            )
            
            print(f"✅ File saved: {file_path}")
            print(f"📎 File URL: {file_url}")
            
            return Response({
                'success': True,
                'message_id': chat_message.id,
                'file_url': file_url,
                'file_name': file.name,
                'file_size': file.size,
                'file_type': file.content_type
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Upload error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Upload failed: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class ApproveJoinRequestView(APIView):
    """Approve or reject join request"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, request_id):
        try:
            join_request = get_object_or_404(JoinRequest, id=request_id)
            room = join_request.room
            
            print(f"🔍 Approve Request Debug:")
            print(f"   Request ID: {request_id}")
            print(f"   Room ID: {room.id}")
            print(f"   Room Name: {room.name}")
            print(f"   Current User: {request.user.username} (ID: {request.user.id})")
            print(f"   Request User: {join_request.user.username} (ID: {join_request.user.id})")
            
            # Check if user is owner or admin of the room
            membership = RoomMembership.objects.filter(
                user=request.user,
                room=room,
                join_status='approved'
            ).first()
            
            if not membership:
                print(f"❌ User {request.user.username} is not a member of room {room.name}")
                return Response({
                    'error': 'You are not a member of this room'
                }, status=status.HTTP_403_FORBIDDEN)
            
            print(f"   User role in room: {membership.role}")
            
            # Only owners and admins can approve requests
            if membership.role not in ['owner', 'admin']:
                print(f"❌ User role {membership.role} cannot approve requests")
                return Response({
                    'error': 'Only owners and admins can approve join requests'
                }, status=status.HTTP_403_FORBIDDEN)
            
            action = request.data.get('action')
            print(f"   Action: {action}")
            
            if action == 'approve':
                # Update membership status
                target_membership = RoomMembership.objects.filter(
                    user=join_request.user,
                    room=room
                ).first()
                
                if target_membership:
                    target_membership.join_status = 'approved'
                    target_membership.save()
                    print(f"✅ Membership approved for {join_request.user.username}")
                else:
                    # Create membership if it doesn't exist
                    RoomMembership.objects.create(
                        user=join_request.user,
                        room=room,
                        role='member',
                        join_status='approved'
                    )
                    print(f"✅ Membership created and approved for {join_request.user.username}")
                
                # Update join request
                join_request.is_approved = True
                join_request.approved_at = timezone.now()
                join_request.approved_by = request.user
                join_request.save()
                
                return Response({
                    'success': True,
                    'message': f'Request approved for {join_request.user.username}'
                })
            
            elif action == 'reject':
                # Delete membership if exists
                RoomMembership.objects.filter(
                    user=join_request.user,
                    room=room
                ).delete()
                
                # Delete the join request
                join_request.delete()
                
                return Response({
                    'success': True,
                    'message': f'Request rejected for {join_request.user.username}'
                })
            
            else:
                return Response({
                    'error': 'Invalid action. Use "approve" or "reject"'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except JoinRequest.DoesNotExist:
            return Response({
                'error': 'Join request not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ Error in approve request: {str(e)}")
            return Response({
                'error': f'Failed to process request: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)