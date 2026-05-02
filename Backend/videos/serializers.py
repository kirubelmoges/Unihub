from rest_framework import serializers
from .models import WatchAgain

class WatchAgainSerializer(serializers.ModelSerializer):
    class Meta:
        model = WatchAgain
        fields = ['id', 'video_url', 'video_id', 'saved_at']

class SaveVideoSerializer(serializers.Serializer):
    video_url = serializers.URLField()
    
    def validate_video_url(self, value):
        # Extract video ID from URL
        import re
        patterns = [
            r'(?:youtube\.com\/watch\?v=)([\w-]+)',
            r'(?:youtu\.be\/)([\w-]+)',
            r'(?:youtube\.com\/embed\/)([\w-]+)'
        ]
        
        video_id = None
        for pattern in patterns:
            match = re.search(pattern, value)
            if match:
                video_id = match.group(1)
                break
        
        if not video_id:
            raise serializers.ValidationError("Invalid YouTube URL")
        
        return {
            'url': value,
            'video_id': video_id
        }