from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html, mark_safe
from django.urls import reverse
from .models import ChatRoom, ChatMessage, RoomMembership, JoinRequest

class RoomMembershipInline(admin.TabularInline):
    """Inline for room memberships in ChatRoom admin"""
    model = RoomMembership
    extra = 0
    fields = ('user', 'role', 'join_status', 'joined_at')
    readonly_fields = ('joined_at',)
    raw_id_fields = ('user',) 
    can_delete = True
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

class JoinRequestInline(admin.TabularInline):
    """Inline for join requests in ChatRoom admin"""
    model = JoinRequest
    extra = 0
    fields = ('user', 'message', 'created_at', 'is_approved')
    readonly_fields = ('created_at',)
    raw_id_fields = ('user',)
    can_delete = True
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

class ChatMessageInline(admin.TabularInline):
    """Inline for messages in ChatRoom admin"""
    model = ChatMessage
    extra = 0
    fields = ('user', 'message_type_badge', 'content_preview', 'file_info', 'timestamp', 'is_read')
    readonly_fields = ('message_type_badge', 'content_preview', 'file_info', 'timestamp')
    raw_id_fields = ('user',)
    can_delete = True
    show_change_link = True
    ordering = ('-timestamp',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
    
    def message_type_badge(self, obj):
        """Show message type as badge"""
        colors = {
            'text': '#6c757d',
            'file': '#17a2b8',
            'image': '#28a745'
        }
        icons = {
            'text': '📝',
            'file': '📎',
            'image': '🖼️'
        }
        return format_html(
            '<span style="background: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">{} {}</span>',
            colors.get(obj.message_type, '#6c757d'),
            icons.get(obj.message_type, '📄'),
            obj.message_type.title()
        )
    message_type_badge.short_description = 'Type'
    
    def content_preview(self, obj):
        """Show preview of message content"""
        if obj.message_type == 'text':
            if obj.content and len(obj.content) > 50:
                return obj.content[:50] + '...'
            return obj.content or ""
        else:
            return f"[{obj.message_type.upper()}] {obj.file_name or 'Unknown file'}"
    content_preview.short_description = 'Content'
    
    def file_info(self, obj):
        """Show file information for file messages"""
        if obj.message_type != 'text' and obj.file_name:
            size = obj.file_size or 0
            if size < 1024:
                size_str = f"{size} B"
            elif size < 1024 * 1024:
                size_str = f"{size/1024:.1f} KB"
            elif size < 1024 * 1024 * 1024:
                size_str = f"{size/(1024*1024):.1f} MB"
            else:
                size_str = f"{size/(1024*1024*1024):.1f} GB"
            
            icon = '🖼️' if obj.message_type == 'image' else '📎'
            return format_html('{} {} ({})', icon, obj.file_name, size_str)
        return "-"
    file_info.short_description = 'File'

@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    """Admin for ChatRoom model"""
    list_display = ('name', 'room_type_badge', 'privacy_badge', 'created_by', 
                   'created_at_formatted', 'members_count', 'messages_count', 'invite_code_display')
    list_filter = ('room_type', 'privacy_level', 'is_private', 'created_at')
    search_fields = ('name', 'description', 'created_by__username')
    readonly_fields = ('created_at', 'invite_code', 'members_list', 'messages_preview', 'participants_count')
    
    
    inlines = [RoomMembershipInline, JoinRequestInline, ChatMessageInline]
    
    fieldsets = (
        ('Room Information', {
            'fields': ('name', 'description', 'room_type', 'privacy_level', 'invite_code')
        }),
        ('Channel Settings', {
            'fields': ('only_owner_can_post',),
            'classes': ('collapse',),
            'description': 'Only applicable for Channels'
        }),
        ('Creator', {
            'fields': ('created_by',)
        }),
        ('Legacy', {
            'fields': ('is_private',),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('participants_count', 'members_list', 'messages_preview'),
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )
    actions = ['make_public', 'make_private', 'make_channel', 'make_group', 'generate_invite_code']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('created_by').prefetch_related(
            'roommembership_set', 'messages'
        )
    
    def room_type_badge(self, obj):
        """Show room type as badge"""
        colors = {
            'group': '#6c757d',
            'private': '#17a2b8',
            'channel': '#ffc107'
        }
        icons = {
            'group': '👥',
            'private': '💬',
            'channel': '📢'
        }
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; border-radius: 3px;">{} {}</span>',
            colors.get(obj.room_type, '#6c757d'),
            icons.get(obj.room_type, '📁'),
            obj.get_room_type_display()
        )
    room_type_badge.short_description = 'Type'
    room_type_badge.admin_order_field = 'room_type'
    
    def privacy_badge(self, obj):
        """Show privacy level as badge"""
        colors = {
            'public': '#28a745',
            'private': '#fd7e14',
            'hidden': '#dc3545'
        }
        icons = {
            'public': '🌍',
            'private': '🔒',
            'hidden': '👁️'
        }
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; border-radius: 3px;">{} {}</span>',
            colors.get(obj.privacy_level, '#6c757d'),
            icons.get(obj.privacy_level, '🔐'),
            obj.get_privacy_level_display().split('-')[0]
        )
    privacy_badge.short_description = 'Privacy'
    privacy_badge.admin_order_field = 'privacy_level'
    
    def invite_code_display(self, obj):
        """Show invite code with copy button"""
        if obj.invite_code:
            return format_html(
                '<span style="font-family: monospace; background: #f0f0f0; padding: 2px 5px; border-radius: 3px;">{}</span>',
                obj.invite_code
            )
        return "-"
    invite_code_display.short_description = 'Invite Code'
    
    def created_at_formatted(self, obj):
        """Format created_at for display"""
        try:
            if timezone.now() - obj.created_at < timezone.timedelta(days=1):
                return format_html('<span style="color: green;">Today {}</span>',
                                 obj.created_at.strftime('%H:%M'))
            return obj.created_at.strftime('%Y-%m-%d %H:%M')
        except:
            return str(obj.created_at)
    created_at_formatted.short_description = 'Created'
    created_at_formatted.admin_order_field = 'created_at'
    
    def participants_count(self, obj):
        """Count of total participants"""
        count = obj.roommembership_set.count()
        approved = obj.roommembership_set.filter(join_status='approved').count()
        pending = obj.roommembership_set.filter(join_status='pending').count()
        return format_html(
            '<b>{} total</b><br><span style="color: green;">✓ {} approved</span><br><span style="color: orange;">⏳ {} pending</span>',
            count, approved, pending
        )
    participants_count.short_description = 'Participants'
    
    def members_count(self, obj):
        """Count of approved members"""
        count = obj.roommembership_set.filter(join_status='approved').count()
        return format_html('<b style="color: {};">{}</b>', 'blue' if count > 0 else 'gray', count)
    members_count.short_description = 'Members'
    members_count.admin_order_field = 'roommembership__count'
    
    def messages_count(self, obj):
        """Count of messages"""
        count = obj.messages.count()
        return format_html('<b>{}</b>', count)
    messages_count.short_description = 'Messages'
    messages_count.admin_order_field = 'messages__count'
    
    def members_list(self, obj):
        """Show list of members with roles"""
        memberships = obj.roommembership_set.filter(join_status='approved').select_related('user')[:10]
        if memberships:
            items = []
            for m in memberships:
                role_icon = '👑' if m.role == 'owner' else '⭐' if m.role == 'admin' else '👤'
                status_icon = '✅' if m.join_status == 'approved' else '⏳' if m.join_status == 'pending' else '❌'
                items.append(f'{role_icon} {status_icon} {m.user.username} ({m.role})')
            if obj.roommembership_set.filter(join_status='approved').count() > 10:
                items.append(f'... and {obj.roommembership_set.filter(join_status="approved").count() - 10} more')
            return mark_safe('<div style="max-height: 200px; overflow-y: auto;">{}</div>'.format('<br>'.join(items)))
        return "No members"
    members_list.short_description = 'Members List'
    
    def messages_preview(self, obj):
        """Show preview of recent messages"""
        try:
            recent_messages = obj.messages.select_related('user').order_by('-timestamp')[:10]
            if recent_messages:
                items = []
                for msg in recent_messages:
                    time = msg.timestamp.strftime('%H:%M')
                    if msg.message_type == 'text':
                        preview = msg.content[:50] + '...' if len(msg.content) > 50 else msg.content
                    else:
                        preview = f'[{msg.message_type}] {msg.file_name or "Unknown"}'
                    
                    items.append(
                        f'<div style="margin: 5px 0; padding: 5px; background: #f8f9fa; border-radius: 3px;">'
                        f'<b>{msg.user.username}</b> <span style="color: #999;">[{time}]</span>: {preview}'
                        f'</div>'
                    )
                return mark_safe(''.join(items))
            return "No messages yet"
        except Exception as e:
            return f"Error loading messages: {str(e)}"
    messages_preview.short_description = 'Recent Messages'
    
    # Actions
    def make_public(self, request, queryset):
        updated = queryset.update(privacy_level='public')
        self.message_user(request, f'{updated} room(s) made public.')
    make_public.short_description = "Make selected rooms public"
    
    def make_private(self, request, queryset):
        updated = queryset.update(privacy_level='private')
        self.message_user(request, f'{updated} room(s) made private.')
    make_private.short_description = "Make selected rooms private"
    
    def make_channel(self, request, queryset):
        updated = queryset.update(room_type='channel')
        self.message_user(request, f'{updated} room(s) converted to channels.')
    make_channel.short_description = "Convert to channels"
    
    def make_group(self, request, queryset):
        updated = queryset.update(room_type='group')
        self.message_user(request, f'{updated} room(s) converted to groups.')
    make_group.short_description = "Convert to groups"
    
    def generate_invite_code(self, request, queryset):
        import uuid
        for room in queryset:
            if not room.invite_code:
                room.invite_code = str(uuid.uuid4())[:8].upper()
                room.save()
        self.message_user(request, f'Invite codes generated for {queryset.count()} room(s).')
    generate_invite_code.short_description = "Generate invite codes"

@admin.register(RoomMembership)
class RoomMembershipAdmin(admin.ModelAdmin):
    """Admin for RoomMembership model"""
    list_display = ('user', 'room_link', 'role_badge', 'join_status_badge', 'joined_at')
    list_filter = ('role', 'join_status')
    search_fields = ('user__username', 'room__name')
    raw_id_fields = ('user', 'room', 'invited_by')
    list_select_related = ('user', 'room', 'invited_by')
    date_hierarchy = 'joined_at'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'room', 'invited_by')
    
    def room_link(self, obj):
        """Link to the room"""
        url = reverse('admin:chat_chatroom_change', args=[obj.room.id])
        return format_html('<a href="{}">{}</a>', url, obj.room.name)
    room_link.short_description = 'Room'
    room_link.admin_order_field = 'room__name'
    
    def role_badge(self, obj):
        """Show role as badge"""
        colors = {
            'owner': '#ffc107',
            'admin': '#17a2b8',
            'member': '#28a745',
            'banned': '#dc3545'
        }
        icons = {
            'owner': '👑',
            'admin': '⭐',
            'member': '👤',
            'banned': '🚫'
        }
        return format_html(
            '<span style="background: {}; color: {}; padding: 2px 6px; border-radius: 3px;">{} {}</span>',
            colors.get(obj.role, '#6c757d'),
            'black' if obj.role == 'owner' else 'white',
            icons.get(obj.role, '❓'),
            obj.role.title()
        )
    role_badge.short_description = 'Role'
    
    def join_status_badge(self, obj):
        """Show join status as badge"""
        colors = {
            'approved': '#28a745',
            'pending': '#ffc107',
            'rejected': '#dc3545'
        }
        icons = {
            'approved': '✅',
            'pending': '⏳',
            'rejected': '❌'
        }
        return format_html(
            '<span style="background: {}; color: {}; padding: 2px 6px; border-radius: 3px;">{} {}</span>',
            colors.get(obj.join_status, '#6c757d'),
            'black' if obj.join_status == 'pending' else 'white',
            icons.get(obj.join_status, '❓'),
            obj.join_status.title()
        )
    join_status_badge.short_description = 'Status'

@admin.register(JoinRequest)
class JoinRequestAdmin(admin.ModelAdmin):
    """Admin for JoinRequest model"""
    list_display = ('user', 'room_link', 'message_preview', 'created_at', 'is_approved_badge')
    list_filter = ('is_approved', 'created_at')
    search_fields = ('user__username', 'room__name', 'message')
    raw_id_fields = ('user', 'room', 'approved_by')
    list_select_related = ('user', 'room', 'approved_by')
    date_hierarchy = 'created_at'
    actions = ['approve_requests', 'reject_requests']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'room', 'approved_by')
    
    def room_link(self, obj):
        """Link to the room"""
        url = reverse('admin:chat_chatroom_change', args=[obj.room.id])
        return format_html('<a href="{}">{}</a>', url, obj.room.name)
    room_link.short_description = 'Room'
    room_link.admin_order_field = 'room__name'
    
    def message_preview(self, obj):
        """Preview of join message"""
        if obj.message and len(obj.message) > 50:
            return obj.message[:50] + '...'
        return obj.message or '-'
    message_preview.short_description = 'Message'
    
    def is_approved_badge(self, obj):
        """Show approval status as badge"""
        if obj.is_approved:
            return format_html('<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px;">✅ Approved</span>')
        return format_html('<span style="background: #ffc107; color: black; padding: 2px 6px; border-radius: 3px;">⏳ Pending</span>')
    is_approved_badge.short_description = 'Status'
    
    def approve_requests(self, request, queryset):
        for req in queryset:
            if not req.is_approved:
                # Update or create membership
                membership, created = RoomMembership.objects.get_or_create(
                    user=req.user,
                    room=req.room,
                    defaults={
                        'role': 'member',
                        'join_status': 'approved',
                        'invited_by': req.user
                    }
                )
                if not created:
                    membership.join_status = 'approved'
                    membership.save()
                
                req.is_approved = True
                req.approved_at = timezone.now()
                req.approved_by = request.user
                req.save()
        
        self.message_user(request, f'{queryset.count()} request(s) approved.')
    approve_requests.short_description = "Approve selected requests"
    
    def reject_requests(self, request, queryset):
        for req in queryset:
            # Delete any pending membership
            RoomMembership.objects.filter(
                user=req.user,
                room=req.room,
                join_status='pending'
            ).delete()
            req.delete()
        
        self.message_user(request, f'{queryset.count()} request(s) rejected.')
    reject_requests.short_description = "Reject selected requests"

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    """Admin for ChatMessage model with file support"""
    list_display = ('id', 'room_link', 'user_link', 'message_type_badge', 
                   'content_or_file_info', 'file_size_display', 'timestamp_formatted', 'is_read_badge')
    list_filter = ('message_type', 'is_read', 'timestamp', 'room', 'user')
    search_fields = ('content', 'file_name', 'user__username', 'room__name')
    readonly_fields = ('timestamp', 'get_message_details_display', 'file_preview')
    raw_id_fields = ('user', 'room')
    date_hierarchy = 'timestamp'
    list_select_related = ('user', 'room')
    list_per_page = 50
    actions = ['mark_as_read', 'mark_as_unread', 'delete_selected']
    
    fieldsets = (
        ('Message Information', {
            'fields': ('room', 'user', 'message_type')
        }),
        ('Content', {
            'fields': ('content',)
        }),
        ('File Information', {
            'fields': ('file', 'file_name', 'file_size', 'file_content_type', 'file_preview'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_read', 'timestamp')
        }),
        ('Details', {
            'fields': ('get_message_details_display',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'room')
    
    def room_link(self, obj):
        """Link to the room"""
        try:
            url = reverse('admin:chat_chatroom_change', args=[obj.room.id])
            return format_html('<a href="{}">{}</a>', url, obj.room.name)
        except:
            return str(obj.room.name) if obj.room else "No room"
    room_link.short_description = 'Room'
    room_link.admin_order_field = 'room__name'
    
    def user_link(self, obj):
        """Link to the user"""
        try:
            url = reverse('admin:auth_user_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.username)
        except:
            return str(obj.user.username) if obj.user else "No user"
    user_link.short_description = 'User'
    user_link.admin_order_field = 'user__username'
    
    def message_type_badge(self, obj):
        """Show message type as colored badge"""
        colors = {
            'text': '#6c757d',
            'file': '#17a2b8',
            'image': '#28a745'
        }
        icons = {
            'text': '📝',
            'file': '📎',
            'image': '🖼️'
        }
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; border-radius: 3px;">{} {}</span>',
            colors.get(obj.message_type, '#6c757d'),
            icons.get(obj.message_type, '📄'),
            obj.message_type.title()
        )
    message_type_badge.short_description = 'Type'
    message_type_badge.admin_order_field = 'message_type'
    
    def content_or_file_info(self, obj):
        """Show content for text messages, file info for file messages"""
        if obj.message_type == 'text':
            if obj.content and len(obj.content) > 50:
                return obj.content[:50] + '...'
            return obj.content or ""
        else:
            return f"{obj.file_name or 'Unknown file'}"
    content_or_file_info.short_description = 'Content/File'
    
    def file_size_display(self, obj):
        """Format file size for display"""
        if obj.file_size and obj.message_type != 'text':
            size = obj.file_size
            if size < 1024:
                return f"{size} B"
            elif size < 1024 * 1024:
                return f"{size/1024:.1f} KB"
            elif size < 1024 * 1024 * 1024:
                return f"{size/(1024*1024):.1f} MB"
            else:
                return f"{size/(1024*1024*1024):.1f} GB"
        return "-"
    file_size_display.short_description = 'Size'
    
    def file_preview(self, obj):
        """Show file preview if it's an image"""
        if obj.message_type == 'image' and obj.file:
            return mark_safe(f'<img src="{obj.file.url}" style="max-height: 200px; max-width: 100%; border-radius: 5px;" />')
        elif obj.file and obj.file_name:
            icon = '🖼️' if obj.message_type == 'image' else '📎'
            file_url = obj.file.url if obj.file else '#'
            return mark_safe(f'<div style="padding: 10px; background: #f8f9fa; border-radius: 5px;">'
                           f'{icon} <a href="{file_url}" target="_blank">{obj.file_name}</a><br>'
                           f'Type: {obj.file_content_type}<br>'
                           f'Size: {self.file_size_display(obj)}</div>')
        return "No file"
    file_preview.short_description = 'File Preview'
    
    def timestamp_formatted(self, obj):
        """Formatted timestamp"""
        try:
            if timezone.now() - obj.timestamp < timezone.timedelta(hours=24):
                return format_html('<span style="color: green;">{}</span>',
                                 obj.timestamp.strftime('%H:%M:%S'))
            return obj.timestamp.strftime('%Y-%m-%d %H:%M')
        except:
            return str(obj.timestamp)
    timestamp_formatted.short_description = 'Time'
    timestamp_formatted.admin_order_field = 'timestamp'
    
    def is_read_badge(self, obj):
        """Show read status as badge"""
        try:
            if obj.is_read:
                return format_html('<span style="background: #28a745; color: white; padding: 3px 8px; border-radius: 3px;">✓ Read</span>')
            return format_html('<span style="background: #ffc107; color: black; padding: 3px 8px; border-radius: 3px;">○ Unread</span>')
        except:
            return "Unknown"
    is_read_badge.short_description = 'Status'
    
    def get_message_details_display(self, obj):
        """Show detailed message information including file data"""
        try:
            details = []
            details.append(f'<b>Message ID:</b> {obj.id}')
            details.append(f'<b>Room:</b> {obj.room.name if obj.room else "None"}')
            details.append(f'<b>User:</b> {obj.user.username if obj.user else "None"} ({obj.user.get_full_name() if obj.user else "None"})')
            details.append(f'<b>Message Type:</b> {obj.message_type}')
            details.append(f'<b>Time:</b> {obj.timestamp.strftime("%Y-%m-%d %H:%M:%S") if obj.timestamp else "None"}')
            details.append(f'<b>Read:</b> {"Yes" if obj.is_read else "No"}')
            
            if obj.message_type == 'text':
                details.append(f'<b>Content:</b> {obj.content}')
                details.append(f'<b>Content Length:</b> {len(obj.content) if obj.content else 0} characters')
            else:
                details.append(f'<b>File Name:</b> {obj.file_name}')
                details.append(f'<b>File Size:</b> {self.file_size_display(obj)}')
                details.append(f'<b>File Type:</b> {obj.file_content_type}')
                if obj.file:
                    file_url = obj.file.url
                    details.append(f'<b>File URL:</b> <a href="{file_url}" target="_blank">{file_url}</a>')
            
            return mark_safe('<div style="background: #f8f9fa; padding: 10px;">{}</div>'.format('<br>'.join(details)))
        except Exception as e:
            return mark_safe(f'<div style="background: #f8d7da; padding: 10px; color: #721c24;">Error loading details: {str(e)}</div>')
    get_message_details_display.short_description = 'Message Details'
    
    # Actions
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} message(s) marked as read.')
    mark_as_read.short_description = "Mark selected messages as read"
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False)
        self.message_user(request, f'{updated} message(s) marked as unread.')
    mark_as_unread.short_description = "Mark selected messages as unread"
    
    def delete_queryset(self, request, queryset):
        """Custom delete with warning - also delete files"""
        count = queryset.count()
        
        # Delete associated files
        for obj in queryset:
            if obj.file:
                try:
                    obj.file.delete(save=False)
                except:
                    pass
        
        if count > 10:
            self.message_user(
                request, 
                f'You are about to delete {count} messages and their associated files.',
                level='WARNING'
            )
        super().delete_queryset(request, queryset)