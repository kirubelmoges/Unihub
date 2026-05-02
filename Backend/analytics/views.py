from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Analytics
from .serializers import AnalyticsSerializer

# Get all analytics
@api_view(['GET'])
def getAnalytics(request):
    analytics = Analytics.objects.all()
    serializer = AnalyticsSerializer(analytics, many=True)
    return Response(serializer.data)

# Get analytics by ID
@api_view(['GET'])
def getAnalyticsById(request, id):
    try:
        analytics = Analytics.objects.get(id=id)
    except Analytics.DoesNotExist:
        return Response({'error': 'Analytics not found'}, status=404)
    serializer = AnalyticsSerializer(analytics)
    return Response(serializer.data)

# Get analytics by Subject
@api_view(['GET'])
def getAnalyticsBySubject(request, subject):
    analytics = Analytics.objects.filter(subject=subject)
    serializer = AnalyticsSerializer(analytics, many=True)
    return Response(serializer.data)

# Create a new analytics record
@api_view(['POST'])
def createAnalytics(request):
    serializer = AnalyticsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'status': 'Analytics created', 'analytics': serializer.data})
    return Response(serializer.errors, status=400)

# Update analytics by ID
@api_view(['PUT'])
def updateAnalytics(request, id):
    try:
        analytics = Analytics.objects.get(id=id)
    except Analytics.DoesNotExist:
        return Response({'error': 'Analytics not found'}, status=404)

    serializer = AnalyticsSerializer(analytics, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

# Delete analytics by ID
@api_view(['DELETE'])
def deleteAnalytics(request, id):
    try:
        analytics = Analytics.objects.get(id=id)
    except Analytics.DoesNotExist:
        return Response({'error': 'Analytics not found'}, status=404)

    analytics.delete()
    return Response({'status': 'Analytics deleted'})


