from django.contrib import admin
from .models import Anouncement

@admin.register(Anouncement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('AnnouncerName', 'AnnouncerPosition', 'AnnouncementSubject', 'AnnouncerEmail')
    search_fields = ('AnnouncerName', 'AnnouncementSubject', 'AnnouncerEmail')
    list_filter = ('AnnouncerPosition',)

