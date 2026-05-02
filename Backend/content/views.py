import requests
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.conf import settings
from .models import SavedContent
from .serializers import SavedContentSerializer, SaveContentSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def search_oer_commons(request):
    """Search OER Commons for PowerPoints and educational content"""
    query = request.query_params.get('q', '')
    page = int(request.query_params.get('page', 1))
    
    if not query:
        return Response({'error': 'Search query required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # OER Commons API endpoint
    url = f"{settings.OER_COMMONS_API_URL}/resources/search"
    
    params = {
        'q': query,
        'api_key': settings.OER_COMMONS_API_KEY,
        'per_page': 20,
        'page': page,
        'sort_by': 'relevance',
        # Filter for presentations and educational materials
        'type': ['presentation', 'lesson_plan', 'activity']
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Transform OER Commons data to our format
        results = []
        for item in data.get('data', []):
            # Determine embed URL (try to get direct embed if available)
            embed_url = item.get('url', '')
            if 'docs.google.com' in embed_url:
                embed_url = embed_url.replace('/edit', '/preview')
            elif 'slideshare' in embed_url:
                embed_url = embed_url + '/embed'
            
            results.append({
                'id': f"oer_{item.get('id')}",
                'title': item.get('title', 'Untitled'),
                'source': 'oer',
                'source_name': 'OER Commons',
                'embed_url': embed_url,
                'source_url': item.get('url', ''),
                'thumbnail': item.get('thumbnail', ''),
                'description': item.get('description', '')[:500],
                'author': item.get('author', 'OER Commons'),
                'content_type': 'presentation',
                'course_code': item.get('subject', '')
            })
        
        return Response({
            'results': results,
            'total': data.get('meta', {}).get('total_count', 0),
            'page': page,
            'source': 'oer'
        })
        
    except requests.exceptions.RequestException as e:
        print(f"OER Commons API error: {e}")
        return Response({
            'error': 'Failed to search OER Commons',
            'results': [],
            'source': 'oer'
        }, status=status.HTTP_200_OK)  # Return empty results instead of error

@api_view(['GET'])
@permission_classes([AllowAny])
def search_mit_ocw(request):
    """Search MIT OpenCourseWare for educational content"""
    query = request.query_params.get('q', '')
    page = int(request.query_params.get('page', 1))
    
    if not query:
        return Response({'error': 'Search query required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # MIT OCW API endpoint
    url = f"{settings.MIT_OCW_API_URL}/search"
    
    params = {
        'q': query,
        'limit': 20,
        'offset': (page - 1) * 20
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Transform MIT OCW data to our format
        results = []
        for item in data.get('results', []):
            results.append({
                'id': f"mit_{item.get('id', '')}",
                'title': item.get('title', 'Untitled'),
                'source': 'mit',
                'source_name': 'MIT OpenCourseWare',
                'embed_url': item.get('url', ''),
                'source_url': item.get('url', ''),
                'thumbnail': item.get('image_url', 'https://ocw.mit.edu/images/ocw_logo.png'),
                'description': item.get('description', '')[:500],
                'author': 'MIT',
                'content_type': 'lecture',
                'course_code': item.get('course_number', '')
            })
        
        return Response({
            'results': results,
            'total': data.get('total', 0),
            'page': page,
            'source': 'mit'
        })
        
    except requests.exceptions.RequestException as e:
        print(f"MIT OCW API error: {e}")
        return Response({
            'error': 'Failed to search MIT OCW',
            'results': [],
            'source': 'mit'
        }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def search_all(request):
    """Search both OER Commons and MIT OCW simultaneously"""
    query = request.query_params.get('q', '')
    
    if not query:
        return Response({'error': 'Search query required'}, status=status.HTTP_400_BAD_REQUEST)
    
    import concurrent.futures
    
    # Search both APIs concurrently
    with concurrent.futures.ThreadPoolExecutor() as executor:
        oer_future = executor.submit(search_oer_commons_sync, query)
        mit_future = executor.submit(search_mit_ocw_sync, query)
        
        oer_results = oer_future.result()
        mit_results = mit_future.result()
    
    # Combine and sort results
    all_results = oer_results + mit_results
    
    return Response({
        'results': all_results,
        'total': len(all_results),
        'oer_count': len(oer_results),
        'mit_count': len(mit_results)
    })

def search_oer_commons_sync(query):
    """Sync version of OER search for concurrent execution"""
    url = f"{settings.OER_COMMONS_API_URL}/resources/search"
    params = {
        'q': query,
        'api_key': settings.OER_COMMONS_API_KEY,
        'per_page': 20,
        'type': ['presentation', 'lesson_plan', 'activity']
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        results = []
        for item in data.get('data', []):
            embed_url = item.get('url', '')
            if 'docs.google.com' in embed_url:
                embed_url = embed_url.replace('/edit', '/preview')
            
            results.append({
                'id': f"oer_{item.get('id')}",
                'title': item.get('title', 'Untitled'),
                'source': 'oer',
                'source_name': 'OER Commons',
                'embed_url': embed_url,
                'source_url': item.get('url', ''),
                'thumbnail': item.get('thumbnail', ''),
                'description': item.get('description', '')[:500],
                'author': item.get('author', 'OER Commons'),
                'content_type': 'presentation'
            })
        return results
    except:
        return []

def search_mit_ocw_sync(query):
    """Sync version of MIT search for concurrent execution"""
    url = f"{settings.MIT_OCW_API_URL}/search"
    params = {'q': query, 'limit': 20}
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        results = []
        for item in data.get('results', []):
            results.append({
                'id': f"mit_{item.get('id', '')}",
                'title': item.get('title', 'Untitled'),
                'source': 'mit',
                'source_name': 'MIT OpenCourseWare',
                'embed_url': item.get('url', ''),
                'source_url': item.get('url', ''),
                'thumbnail': item.get('image_url', 'https://ocw.mit.edu/images/ocw_logo.png'),
                'description': item.get('description', '')[:500],
                'author': 'MIT',
                'content_type': 'lecture'
            })
        return results
    except:
        return []

@api_view(['GET'])
@permission_classes([AllowAny])
def get_featured_content(request):
    """Get featured/popular content from both sources"""
    # For demo, return some popular topics
    topics = ['computer science', 'mathematics', 'physics', 'biology', 'history']
    
    import random
    featured = []
    
    for topic in topics:
        oer_results = search_oer_commons_sync(topic)
        if oer_results:
            featured.extend(oer_results[:2])
        
        mit_results = search_mit_ocw_sync(topic)
        if mit_results:
            featured.extend(mit_results[:2])
        
        if len(featured) >= 12:
            break
    
    return Response({'results': featured[:12]})

# ============ READ LATER / SAVED CONTENT SECTION ============

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_for_later(request):
    """Save presentation to Read Later list"""
    serializer = SaveContentSerializer(data=request.data)
    
    if serializer.is_valid():
        data = serializer.validated_data
        
        # Check if already saved
        existing = SavedContent.objects.filter(
            user=request.user,
            content_id=data['content_id']
        ).first()
        
        if existing:
            return Response({
                'message': 'Already in your Read Later list 📖',
                'content': SavedContentSerializer(existing).data
            })
        
        saved = SavedContent.objects.create(
            user=request.user,
            content_id=data['content_id'],
            title=data['title'],
            source=data['source'],
            content_type=data['content_type'],
            embed_url=data['embed_url'],
            source_url=data['source_url'],
            thumbnail=data.get('thumbnail', ''),
            description=data.get('description', ''),
            author=data.get('author', ''),
            course_code=data.get('course_code', '')
        )
        
        return Response({
            'message': 'Added to Read Later! 📚',
            'content': SavedContentSerializer(saved).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_read_later(request):
    """Get user's Read Later list"""
    saved = SavedContent.objects.filter(user=request.user)
    serializer = SavedContentSerializer(saved, many=True)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_read_later(request, content_id):
    """Remove content from Read Later list"""
    try:
        saved = SavedContent.objects.get(user=request.user, content_id=content_id)
        saved.delete()
        return Response({'message': 'Removed from Read Later'})
    except SavedContent.DoesNotExist:
        return Response({'error': 'Content not found'}, status=status.HTTP_404_NOT_FOUND)

# ============ LEGACY SUPPORT (keep for compatibility) ============

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_content(request):
    """Legacy: Save educational content to user's library"""
    return save_for_later(request)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_saved_content(request):
    """Legacy: Get user's saved content"""
    return get_read_later(request)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_saved_content(request, content_id):
    """Legacy: Remove saved content from library"""
    return remove_from_read_later(request, content_id)