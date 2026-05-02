
from django.contrib import admin
from .models import SavedContent

@admin.register(SavedContent)
class SavedContentAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'source', 'content_type', 'saved_at']
    list_filter = ['source', 'content_type', 'saved_at']
    search_fields = ['title', 'description', 'author', 'course_code']
    readonly_fields = ['saved_at']
    
    fieldsets = (
        ('Content Information', {
            'fields': ('title', 'description', 'author', 'course_code')
        }),
        ('Source Details', {
            'fields': ('source', 'content_type', 'source_url', 'embed_url')
        }),
        ('Metadata', {
            'fields': ('user', 'saved_at', 'thumbnail'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['delete_selected']

admin.site.site_header = 'EduHub Admin'
admin.site.site_title = 'EduHub Admin Portal'
admin.site.index_title = 'Welcome to EduHub Administration'