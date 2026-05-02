from django.contrib import admin
from .models import Atendance

@admin.register(Atendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'id_no', 'departement', 'carear_year', 'grad_undergrad', 'Precence')
    search_fields = ('name', 'email', 'id_no', 'departement')
    list_filter = ('carear_year', 'grad_undergrad', 'Precence')


