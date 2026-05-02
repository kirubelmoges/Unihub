from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Grade
from .serializers import GradeSerializer

# ---------------- GRADES ---------------- #

@api_view(['GET'])
def get_grades(request):
    grades = Grade.objects.all()
    serializer = GradeSerializer(grades, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_grade_by_id(request, id):
    grade = Grade.objects.get(id=id)
    serializer = GradeSerializer(grade)
    return Response(serializer.data)

@api_view(['GET'])
def get_grade_by_student(request, id_no):
    grades = Grade.objects.filter(id_no=id_no)
    serializer = GradeSerializer(grades, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def create_grade(request):
    serializer = GradeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'status': 'Created', 'data': serializer.data})
    return Response(serializer.errors, status=400)

@api_view(['PUT'])
def update_grade(request, id):
    grade = Grade.objects.get(id=id)
    serializer = GradeSerializer(grade, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
def delete_grade(request, id):
    grade = Grade.objects.get(id=id)
    grade.delete()
    return Response({'status': 'Deleted'})

