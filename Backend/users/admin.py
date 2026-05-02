from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'

class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_user_type')
    list_select_related = ('profile',)
    
    def get_user_type(self, instance):
        return instance.profile.student_or_instractor or 'Not set'
    get_user_type.short_description = 'User Type'

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'university', 'student_or_instractor', 'department', 'country')
    list_filter = ('student_or_instractor', 'grad_undergrad', 'country', 'university')
    search_fields = ('user__username', 'user__email', 'university', 'department')