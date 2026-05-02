from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from datetime import timedelta
import json
from .models import VideoRoom, RoomParticipant

@csrf_exempt
def create_room(request):
    """Create a new video room"""
    if request.method == 'POST':
        data = json.loads(request.body) if request.body else {}
        name = data.get('name', '')
        
        room = VideoRoom.objects.create(
            name=name,
            created_by=request.user if request.user.is_authenticated else None,
            expires_at=timezone.now() + timedelta(hours=2)
        )
        
        return JsonResponse({
            'success': True,
            'room': {
                'token': room.token,
                'name': room.name,
                'created_at': room.created_at
            }
        })
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def join_room(request, room_token):
    """Validate room token"""
    if request.method == 'POST':
        try:
            room = VideoRoom.objects.get(token=room_token, is_active=True)
            
            # Check if expired
            if room.expires_at and room.expires_at < timezone.now():
                room.is_active = False
                room.save()
                return JsonResponse({'error': 'Room expired'}, status=404)
            
            return JsonResponse({
                'success': True,
                'room': {
                    'token': room.token,
                    'name': room.name,
                    'created_at': room.created_at
                }
            })
        except VideoRoom.DoesNotExist:
            return JsonResponse({'error': 'Room not found'}, status=404)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def get_room(request, room_token):
    """Get room info"""
    try:
        room = VideoRoom.objects.get(token=room_token, is_active=True)
        participants = RoomParticipant.objects.filter(
            room=room,
            left_at__isnull=True
        ).count()
        
        return JsonResponse({
            'success': True,
            'room': {
                'token': room.token,
                'name': room.name,
                'created_at': room.created_at,
                'participants': participants
            }
        })
    except VideoRoom.DoesNotExist:
        return JsonResponse({'error': 'Room not found'}, status=404)