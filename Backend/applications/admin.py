from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from django.urls import reverse
from .models import Application

class ApplicationAdmin(admin.ModelAdmin):
    list_display = ['applicant_link', 'job_link', 'status', 'applied_at', 'response_deadline', 'deadline_status', 'action_buttons']
    list_filter = ['status', 'applied_at', 'job__type', 'job__location']
    search_fields = ['applicant__username', 'applicant__email', 'job__title', 'cover_letter', 'applicant_email']
    readonly_fields = ['applied_at', 'response_deadline', 'manager_responded_at', 'accepted_at', 'completed_at', 'application_details']
    
    fieldsets = (
        ('Job & Applicant', {
            'fields': ('job', 'applicant', 'application_details')
        }),
        ('Application Documents', {
            'fields': ('cover_letter', 'resume', 'essay', 'additional_documents')
        }),
        ('Contact Information', {
            'fields': ('applicant_email', 'applicant_phone', 'applicant_education', 'applicant_experience')
        }),
        ('Status & Deadlines', {
            'fields': ('status', 'applied_at', 'response_deadline', 'manager_responded_at', 'accepted_at', 'completed_at')
        }),
        ('Manager Message', {
            'fields': ('manager_message',),
            'classes': ('collapse',)
        })
    )
    
    def applicant_link(self, obj):
        if obj.applicant:
            url = reverse('admin:auth_user_change', args=[obj.applicant.id])
            return format_html('<a href="{}">{}</a>', url, obj.applicant.username)
        return '-'
    applicant_link.short_description = 'Applicant'
    
    def job_link(self, obj):
        if obj.job:
            url = reverse('admin:jobs_job_change', args=[obj.job.id])
            return format_html('<a href="{}">{}</a>', url, obj.job.title)
        return '-'
    job_link.short_description = 'Job'
    
    def deadline_status(self, obj):
        if obj.status != 'pending':
            return format_html('<span style="color: gray;">-</span>')
        
        if obj.is_response_expired():
            return format_html('<span style="color: red;">⚠️ Expired</span>')
        
        remaining = (obj.response_deadline - timezone.now()).days
        if remaining < 0:
            return format_html('<span style="color: red;">Overdue</span>')
        elif remaining < 3:
            return format_html('<span style="color: orange;">{} days left</span>', remaining)
        else:
            return format_html('<span style="color: green;">{} days left</span>', remaining)
    deadline_status.short_description = 'Response Deadline'
    
    def application_details(self, obj):
        return format_html("""
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                <strong>Applicant Info:</strong><br/>
                Name: {}<br/>
                Email: {}<br/>
                Phone: {}<br/><br/>
                <strong>Education:</strong><br/>
                {}<br/><br/>
                <strong>Experience:</strong><br/>
                {}
            </div>
        """, 
            obj.applicant.get_full_name() or obj.applicant.username,
            obj.applicant_email,
            obj.applicant_phone or 'Not provided',
            obj.applicant_education or 'Not provided',
            obj.applicant_experience or 'Not provided'
        )
    application_details.short_description = 'Application Details'
    
    def action_buttons(self, obj):
        if obj.status == 'pending' and not obj.is_response_expired():
            return format_html("""
                <div>
                    <a class="button" href="{}" style="background: #4CAF50; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px; margin-right: 5px;">
                        Accept
                    </a>
                    <a class="button" href="{}" style="background: #f44336; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px;">
                        Reject
                    </a>
                </div>
            """, f"accept/{obj.id}/", f"reject/{obj.id}/")
        elif obj.status == 'accepted' and not obj.completed_at:
            return format_html("""
                <a class="button" href="{}" style="background: #2196F3; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px;">
                    Mark Complete
                </a>
            """, f"complete/{obj.id}/")
        return '-'
    action_buttons.short_description = 'Quick Actions'
    
    def get_urls(self):
        from django.urls import path
        from django.http import HttpResponseRedirect
        from django.contrib import messages
        
        urls = super().get_urls()
        custom_urls = [
            path('accept/<int:app_id>/', self.admin_site.admin_view(self.accept_application), name='accept_application'),
            path('reject/<int:app_id>/', self.admin_site.admin_view(self.reject_application), name='reject_application'),
            path('complete/<int:app_id>/', self.admin_site.admin_view(self.complete_application), name='complete_application'),
        ]
        return custom_urls + urls
    
    def accept_application(self, request, app_id):
        from django.shortcuts import get_object_or_404
        from django.core.mail import send_mail
        from django.conf import settings
        
        application = get_object_or_404(Application, id=app_id)
        
        if application.status == 'pending':
            application.accept_application()
            
            # Send congratulation letter
            letter_content = f"""CONGRATULATIONS! 🎉

Dear {application.applicant.get_full_name() or application.applicant.username},

Your application for "{application.job.title}" has been ACCEPTED!

Please log in to your dashboard and click the "Complete" button to finalize the process.

Best regards,
{application.job.manager.get_full_name() or application.job.manager.username}
"""
            try:
                send_mail(
                    f'Application Accepted - {application.job.title}',
                    letter_content,
                    settings.DEFAULT_FROM_EMAIL,
                    [application.applicant.email],
                    fail_silently=True,
                )
            except Exception:
                pass
            
            messages.success(request, f'Application #{app_id} has been accepted. Email notification sent.')
        
        return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/admin/applications/application/'))
    
    def reject_application(self, request, app_id):
        from django.shortcuts import get_object_or_404
        
        application = get_object_or_404(Application, id=app_id)
        if application.status == 'pending':
            application.reject_application()
            messages.success(request, f'Application #{app_id} has been rejected.')
        
        return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/admin/applications/application/'))
    
    def complete_application(self, request, app_id):
        from django.shortcuts import get_object_or_404
        
        application = get_object_or_404(Application, id=app_id)
        if application.status == 'accepted' and not application.completed_at:
            application.complete_application()
            messages.success(request, f'Application #{app_id} has been marked as completed.')
        
        return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/admin/applications/application/'))
    
    actions = ['accept_selected', 'reject_selected', 'mark_as_completed']
    
    def accept_selected(self, request, queryset):
        count = 0
        for app in queryset:
            if app.status == 'pending':
                app.accept_application()
                count += 1
        self.message_user(request, f'{count} applications accepted.')
    accept_selected.short_description = "Accept selected applications"
    
    def reject_selected(self, request, queryset):
        count = 0
        for app in queryset:
            if app.status == 'pending':
                app.reject_application()
                count += 1
        self.message_user(request, f'{count} applications rejected.')
    reject_selected.short_description = "Reject selected applications"
    
    def mark_as_completed(self, request, queryset):
        count = 0
        for app in queryset:
            if app.status == 'accepted' and not app.completed_at:
                app.complete_application()
                count += 1
        self.message_user(request, f'{count} applications marked as completed.')
    mark_as_completed.short_description = "Mark selected as completed"

admin.site.register(Application, ApplicationAdmin)
