from django.contrib import admin
from .models import VideoRoom, RoomParticipant

@admin.register(VideoRoom)
class VideoRoomAdmin(admin.ModelAdmin):
    list_display = ('token', 'name', 'created_by', 'created_at', 'is_active')
    list_filter = ('is_active', 'created_at')
    search_fields = ('token', 'name', 'created_by__username')
    readonly_fields = ('token', 'created_at')
    actions = ['deactivate_rooms']
    
    def deactivate_rooms(self, request, queryset):
        queryset.update(is_active=False)
    deactivate_rooms.short_description = "Deactivate selected rooms"

@admin.register(RoomParticipant)
class RoomParticipantAdmin(admin.ModelAdmin):
    list_display = ('room', 'user', 'session_id', 'joined_at')
    list_filter = ('joined_at', 'room')
    search_fields = ('room__token', 'user__username', 'session_id')