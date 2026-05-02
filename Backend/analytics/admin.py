from django.contrib import admin
from .models import Analytics

@admin.register(Analytics)
class AnalyticsAdmin(admin.ModelAdmin):
    list_display = ('subject', 'writterEmail', 'country', 'university', 'departement')
    search_fields = ('subject', 'writterEmail', 'country', 'university')

