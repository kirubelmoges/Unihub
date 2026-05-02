from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'scheduled_datetime', 'priority', 'status', 'enable_alarm']
    list_filter = ['status', 'priority', 'enable_alarm', 'repeat_type', 'scheduled_date']
    search_fields = ['title', 'description', 'user__username', 'user__email', 'category']
    readonly_fields = ['created_at', 'updated_at', 'completed_at', 'alarm_sent_at', 'scheduled_datetime']
    
    fieldsets = (
        ('Task Information', {
            'fields': ('user', 'title', 'description', 'category')
        }),
        ('Schedule', {
            'fields': ('scheduled_date', 'scheduled_time', 'scheduled_datetime', 'location', 'url')
        }),
        ('Priority & Status', {
            'fields': ('priority', 'status')
        }),
        ('Alarm Settings', {
            'fields': ('enable_alarm', 'alarm_minutes_before', 'alarm_sent', 'alarm_sent_at')
        }),
        ('Recurring Settings', {
            'fields': ('repeat_type', 'repeat_until', 'parent_task')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at')
        }),
    )
