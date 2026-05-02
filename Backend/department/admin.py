from django.contrib import admin
from .models import Departement, Course, ClassToEnroll

# ===================== DEPARTEMENT ADMIN =====================
@admin.register(Departement)
class DepartementAdmin(admin.ModelAdmin):
    list_display = ('name', 'din', 'councelor')  
    search_fields = ('name', 'din', 'councelor')  
    list_filter = ('councelor',) 

# ===================== COURSE ADMIN =====================
@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'instructor', 'credit_hour', 'ects')
    search_fields = ('name', 'instructor')
    list_filter = ('credit_hour',)

# ===================== CLASS TO ENROLL ADMIN =====================
@admin.register(ClassToEnroll)
class ClassToEnrollAdmin(admin.ModelAdmin):
    list_display = ('fallOrSpring', 'Departement')
    search_fields = ('fallOrSpring', 'Departement__name') 
    list_filter = ('fallOrSpring',)

