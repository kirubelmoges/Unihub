
from django.contrib import admin
from .models import SavedBook

@admin.register(SavedBook)
class SavedBookAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'author', 'saved_at']
    list_filter = ['saved_at', 'language']
    search_fields = ['title', 'author', 'description']
    readonly_fields = ['saved_at']