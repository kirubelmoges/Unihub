from django.contrib import admin
from .models import Grade

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('courseName', 'id_no', 'grade', 'university', 'departement', 'carear_year')
    search_fields = ('courseName', 'id_no', 'university', 'departement')
    list_filter = ('carear_year', 'grad_undergrad')


