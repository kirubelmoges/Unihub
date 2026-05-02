from rest_framework.decorators import api_view
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Departement, Course, ClassToEnroll
from .serializers import (
    DepartementSerializer,
    courseSerializer,
    ClassToEnrollSerializer
)

# ===================== DEPARTEMENT =====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_departements(request):
    departements = Departement.objects.all()
    serializer = DepartementSerializer(departements, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_departement_by_id(request, id):
    departement = Departement.objects.get(id=id)
    serializer = DepartementSerializer(departement)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_departement(request):
    serializer = DepartementSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_departement(request, id):
    departement = Departement.objects.get(id=id)
    serializer = DepartementSerializer(departement, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_departement(request, id):
    departement = Departement.objects.get(id=id)
    departement.delete()
    return Response({'status': 'Departement deleted'})


# ===================== COURSE =====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_courses(request):
    courses = Course.objects.all()
    serializer = courseSerializer(courses, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_course_by_id(request, id):
    course = Course.objects.get(id=id)
    serializer = courseSerializer(course)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_course(request):
    serializer = courseSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_course(request, id):
    course = Course.objects.get(id=id)
    serializer = courseSerializer(course, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_course(request, id):
    course = Course.objects.get(id=id)
    course.delete()
    return Response({'status': 'Course deleted'})


# ===================== CLASS TO ENROLL =====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_classes(request):
    classes = ClassToEnroll.objects.all()
    serializer = ClassToEnrollSerializer(classes, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_class_by_id(request, id):
    clas = ClassToEnroll.objects.get(id=id)
    serializer = ClassToEnrollSerializer(clas)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_class(request):
    serializer = ClassToEnrollSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_class(request, id):
    clas = ClassToEnroll.objects.get(id=id)
    serializer = ClassToEnrollSerializer(clas, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_class(request, id):
    clas = ClassToEnroll.objects.get(id=id)
    clas.delete()
    return Response({'status': 'Class deleted'})

