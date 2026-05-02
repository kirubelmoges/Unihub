
from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from .models import Job

class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'manager', 'type', 'location', 'status', 'application_deadline', 'is_expired_display', 'applications_count', 'created_at']
    list_filter = ['status', 'type', 'location', 'created_at', 'application_deadline']
    search_fields = ['title', 'description', 'requirements', 'manager__username', 'manager__email', 'location']
    readonly_fields = ['created_at', 'updated_at', 'applications_count_display']
    fieldsets = (
        ('Basic Information', {
            'fields': ('manager', 'title', 'type', 'location', 'salary_range')
        }),
        ('Description', {
            'fields': ('description', 'requirements')
        }),
        ('Requirements & Documents', {
            'fields': ('requires_resume', 'requires_essay', 'requires_additional_docs'),
            'classes': ('collapse',)
        }),
        ('Deadlines & Status', {
            'fields': ('application_deadline', 'response_deadline_days', 'status')
        }),
        ('System Fields', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def is_expired_display(self, obj):
        if obj.is_expired():
            return format_html('<span style="color: red;">✓ Expired</span>')
        remaining = (obj.application_deadline - timezone.now()).days
        return format_html('<span style="color: green;">{} days left</span>', remaining)
    is_expired_display.short_description = 'Deadline Status'
    
    def applications_count(self, obj):
        count = obj.applications.count()
        return format_html('<a href="/admin/applications/application/?job__id__exact={}">{}</a>', obj.id, count)
    applications_count.short_description = '# Applications'
    
    def applications_count_display(self, obj):
        return obj.applications.count()
    applications_count_display.short_description = 'Total Applications'
    
    def save_model(self, request, obj, form, change):
        if not obj.manager_id:
            obj.manager = request.user
        super().save_model(request, obj, form, change)
    
    actions = ['make_active', 'make_expired', 'make_filled', 'make_cancelled']
    
    def make_active(self, request, queryset):
        queryset.update(status='active')
    make_active.short_description = "Mark selected jobs as Active"
    
    def make_expired(self, request, queryset):
        queryset.update(status='expired')
    make_expired.short_description = "Mark selected jobs as Expired"
    
    def make_filled(self, request, queryset):
        queryset.update(status='filled')
    make_filled.short_description = "Mark selected jobs as Filled"
    
    def make_cancelled(self, request, queryset):
        queryset.update(status='cancelled')
    make_cancelled.short_description = "Mark selected jobs as Cancelled"

admin.site.register(Job, JobAdmin)