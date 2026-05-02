from rest_framework import serializers
from .models import Atendance

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Atendance
        fields = '__all__'
