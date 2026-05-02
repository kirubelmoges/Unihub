from django.contrib import admin
from .models import WatchAgain

@admin.register(WatchAgain)
class WatchAgainAdmin(admin.ModelAdmin):
    list_display = ['user', 'video_id', 'saved_at']
    list_filter = ['saved_at', 'user']
    search_fields = ['video_id', 'video_url', 'user__username', 'user__email']
    readonly_fields = ['saved_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Video Information', {
            'fields': ('video_id', 'video_url')
        }),
        ('Timestamp', {
            'fields': ('saved_at',)
        }),
    )
