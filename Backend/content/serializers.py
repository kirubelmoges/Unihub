from rest_framework import serializers
from .models import SavedContent

class SavedContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedContent
        fields = ['id', 'content_id', 'title', 'source', 'content_type', 
                 'embed_url', 'source_url', 'thumbnail', 'description', 
                 'author', 'course_code', 'saved_at']

class SaveContentSerializer(serializers.Serializer):
    content_id = serializers.CharField()
    title = serializers.CharField()
    source = serializers.CharField()
    content_type = serializers.CharField()
    embed_url = serializers.URLField()
    source_url = serializers.URLField()
    thumbnail = serializers.URLField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    author = serializers.CharField(required=False, allow_blank=True)
    course_code = serializers.CharField(required=False, allow_blank=True)