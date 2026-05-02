from rest_framework import serializers
from .models import Anouncement

class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anouncement
        fields = '__all__'
