from rest_framework import serializers
from .models import Departement, Course, ClassToEnroll


class DepartementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departement
        fields = ['name','image','din','councelor','description']


class courseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['name','image','ects','credit_hour','instructor','description']


class ClassToEnrollSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassToEnroll
        fields = ['fallOrSpring','description','Departement']