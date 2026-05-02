from rest_framework import serializers
from .models import ChatRoom, ChatMessage, RoomMembership, JoinRequest
from users.serializers import UserSerializer

class RoomMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = RoomMembership
        fields = ['id', 'user', 'role', 'join_status', 'joined_at']

class JoinRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = JoinRequest
        fields = ['id', 'user', 'message', 'created_at', 'is_approved']

class ChatRoomSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()
    pending_requests = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    user_join_status = serializers.SerializerMethodField()
    created_by_details = UserSerializer(source='created_by', read_only=True)
    invite_code = serializers.CharField(read_only=True)
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'description', 'room_type', 'privacy_level',
                  'created_at', 'created_by', 'created_by_details', 'is_private',
                  'invite_code', 'only_owner_can_post', 'members', 'pending_requests',
                  'user_role', 'user_join_status', 'last_message']
    
    def get_members(self, obj):
        memberships = obj.roommembership_set.filter(join_status='approved').select_related('user', 'user__profile')
        return RoomMembershipSerializer(memberships, many=True).data
    
    def get_pending_requests(self, obj):
        user = self.context.get('request').user
        is_admin = obj.roommembership_set.filter(
            user=user,
            role__in=['owner', 'admin']
        ).exists()
        
        if is_admin:
            requests = JoinRequest.objects.filter(room=obj, is_approved=False).select_related('user')
            return JoinRequestSerializer(requests, many=True).data
        return []
    
    def get_user_role(self, obj):
        user = self.context.get('request').user
        membership = obj.roommembership_set.filter(user=user).first()
        return membership.role if membership else None
    
    def get_user_join_status(self, obj):
        user = self.context.get('request').user
        membership = obj.roommembership_set.filter(user=user).first()
        return membership.join_status if membership else None
    
    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        if last_msg:
            return {
                'content': last_msg.content[:50] if last_msg.message_type == 'text' else f'[{last_msg.message_type}] {last_msg.file_name}',
                'timestamp': last_msg.timestamp,
                'user': last_msg.user.username,
                'type': last_msg.message_type
            }
        return None

class ChatMessageSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    is_owner = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'room', 'user', 'content', 'message_type',
                  'file', 'file_name', 'file_size', 'file_content_type',
                  'timestamp', 'is_read', 'is_owner']
    
    def get_is_owner(self, obj):
        return obj.user == obj.room.created_by