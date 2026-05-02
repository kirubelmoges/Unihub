from rest_framework import serializers
from .models import SavedBook

class SavedBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedBook
        fields = ['id', 'book_id', 'title', 'author', 'embed_url', 'source_url', 
                 'thumbnail', 'description', 'year', 'language', 'saved_at']

class SaveBookSerializer(serializers.Serializer):
    book_id = serializers.CharField(max_length=500)
    title = serializers.CharField(max_length=500)
    author = serializers.CharField(required=False, allow_blank=True)
    embed_url = serializers.URLField()
    source_url = serializers.URLField()
    thumbnail = serializers.URLField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    year = serializers.CharField(required=False, allow_blank=True)
    language = serializers.CharField(required=False, allow_blank=True)