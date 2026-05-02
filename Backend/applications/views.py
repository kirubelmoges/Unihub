from django.shortcuts import render

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User
from .models import Application
from jobs.models import Job
from .serializers import (
    ApplicationSerializer, ApplicationCreateSerializer, 
    ApplicationResponseSerializer
)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_for_job(request):
    # Check if user is student/applicant
    if not hasattr(request.user, 'profile') or request.user.profile.student_or_instractor != 'student':
        return Response({'error': 'Only students can apply for jobs'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    serializer = ApplicationCreateSerializer(data=request.data)
    if serializer.is_valid():
        job_id = serializer.validated_data['job'].id
        try:
            job = Job.objects.get(id=job_id)
            
            # Check if already applied
            if Application.objects.filter(job=job, applicant=request.user).exists():
                return Response({'error': 'You have already applied for this job'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Auto-fill email from user if not provided
            application_data = serializer.validated_data
            if not application_data.get('applicant_email'):
                application_data['applicant_email'] = request.user.email
            
            # Auto-fill phone from profile if available
            if not application_data.get('applicant_phone') and hasattr(request.user, 'profile'):
                application_data['applicant_phone'] = request.user.profile.id_no or ''
            
            application = Application.objects.create(
                applicant=request.user,
                **application_data
            )
            
            # Send confirmation email
            try:
                send_mail(
                    f'Application Received - {job.title}',
                    f'''Dear {request.user.get_full_name() or request.user.username},

Thank you for applying for {job.title} at {job.location}.

Your application has been received and will be reviewed by the hiring team.

You will receive a response by {application.response_deadline.strftime('%Y-%m-%d %H:%M')}.

Best regards,
{job.manager.get_full_name() or job.manager.username}
''',
                    settings.DEFAULT_FROM_EMAIL,
                    [request.user.email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Email sending failed: {e}")
            
            return Response(ApplicationSerializer(application).data, 
                          status=status.HTTP_201_CREATED)
            
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_applications(request):
    applications = Application.objects.filter(applicant=request.user).order_by('-applied_at')
    
    # Check for expired responses
    for app in applications:
        if app.is_response_expired() and app.status == 'pending':
            app.status = 'expired'
            app.save()
    
    serializer = ApplicationSerializer(applications, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def job_applications(request, job_id):
    try:
        job = Job.objects.get(id=job_id, manager=request.user)
        applications = Application.objects.filter(job=job).order_by('-applied_at')
        
        # Check for expired responses
        for app in applications:
            if app.is_response_expired() and app.status == 'pending':
                app.status = 'expired'
                app.save()
        
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found or you do not have permission'}, 
                       status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_application(request, application_id):
    # Check if user is instructor/manager
    if not hasattr(request.user, 'profile') or request.user.profile.student_or_instractor != 'instructor':
        return Response({'error': 'Only instructors/managers can respond to applications'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        application = Application.objects.get(id=application_id, job__manager=request.user)
        
        if application.status != 'pending':
            return Response({'error': f'Application already {application.status}'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if application.is_response_expired():
            application.status = 'expired'
            application.save()
            return Response({'error': 'Response deadline has expired'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ApplicationResponseSerializer(data=request.data)
        if serializer.is_valid():
            action = serializer.validated_data['action']
            manager_message = serializer.validated_data.get('manager_message', '')
            
            if action == 'accept':
                application.accept_application(manager_message)
                
                # Prepare acceptance letter
                if manager_message:
                    letter_content = manager_message
                else:
                    letter_content = f"""CONGRATULATIONS! 🎉

Dear {application.applicant.get_full_name() or application.applicant.username},

We are pleased to inform you that your application for the position of "{application.job.title}" has been ACCEPTED!

We were thoroughly impressed with your qualifications and believe you would be a great fit for our team.

Next Steps:
1. Please log into your dashboard
2. Click the "Complete" button for this application
3. You will receive further instructions via email

Position Details:
- Role: {application.job.title}
- Location: {application.job.location}
- Type: {application.job.get_type_display()}

We look forward to working with you!

Best regards,
{application.job.manager.get_full_name() or application.job.manager.username}
{application.job.manager.email}
"""
                
                # Send acceptance letter email
                try:
                    send_mail(
                        f'🎉 Application Accepted - {application.job.title}',
                        letter_content,
                        settings.DEFAULT_FROM_EMAIL,
                        [application.applicant.email],
                        fail_silently=False,
                    )
                except Exception as e:
                    print(f"Email sending failed: {e}")
                
                message = 'Application accepted successfully'
            else:
                application.reject_application()
                message = 'Application rejected'
            
            return Response({
                'message': message, 
                'application': ApplicationSerializer(application).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Application.DoesNotExist:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_application(request, application_id):
    try:
        application = Application.objects.get(id=application_id, applicant=request.user)
        
        if application.status != 'accepted':
            return Response({'error': 'Only accepted applications can be completed'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if application.completed_at:
            return Response({'error': 'Application already completed'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        application.complete_application()
        
        # Notify manager
        try:
            send_mail(
                f'Application Completed - {application.job.title}',
                f'''Dear {application.job.manager.get_full_name() or application.job.manager.username},

{application.applicant.get_full_name() or application.applicant.username} has completed the application process for {application.job.title}.

You can view the completed application in your dashboard.

Best regards,
System Notification''',
                settings.DEFAULT_FROM_EMAIL,
                [application.job.manager.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Email sending failed: {e}")
        
        return Response({
            'message': 'Application completed successfully! Congratulations! 🎉',
            'application': ApplicationSerializer(application).data
        })
    
    except Application.DoesNotExist:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_application(request, application_id):
    try:
        application = Application.objects.get(id=application_id)
        
        # Check permission
        if request.user != application.applicant and request.user != application.job.manager:
            return Response({'error': 'You do not have permission to view this application'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        serializer = ApplicationSerializer(application)
        return Response(serializer.data)
    
    except Application.DoesNotExist:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)
