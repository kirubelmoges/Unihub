from django.shortcuts import render
import requests
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import SavedBook
from .serializers import SavedBookSerializer, SaveBookSerializer

# Default books to show on first load
DEFAULT_BOOKS = [
    {
        'id': 'TheAdventuresOfSherlockHolmes',
        'title': 'The Adventures of Sherlock Holmes',
        'author': 'Arthur Conan Doyle',
        'cover': 'https://archive.org/services/img/TheAdventuresOfSherlockHolmes',
        'description': 'A collection of twelve short stories featuring the famous detective Sherlock Holmes.',
        'year': '1892',
        'language': 'English'
    },
    {
        'id': 'frankenstein',
        'title': 'Frankenstein',
        'author': 'Mary Shelley',
        'cover': 'https://archive.org/services/img/frankenstein',
        'description': 'The classic gothic novel about Victor Frankenstein and his creature.',
        'year': '1818',
        'language': 'English'
    },
    {
        'id': 'prideandprejudice',
        'title': 'Pride and Prejudice',
        'author': 'Jane Austen',
        'cover': 'https://archive.org/services/img/prideandprejudice',
        'description': 'A romantic novel of manners set in Georgian England.',
        'year': '1813',
        'language': 'English'
    },
    {
        'id': 'mobydick',
        'title': 'Moby-Dick',
        'author': 'Herman Melville',
        'cover': 'https://archive.org/services/img/mobydick',
        'description': 'The saga of Captain Ahab and his obsessive quest for the white whale.',
        'year': '1851',
        'language': 'English'
    },
    {
        'id': 'greatgatsby',
        'title': 'The Great Gatsby',
        'author': 'F. Scott Fitzgerald',
        'cover': 'https://archive.org/services/img/greatgatsby',
        'description': 'A story of wealth, love, and the American Dream in the Jazz Age.',
        'year': '1925',
        'language': 'English'
    },
    {
        'id': 'dracula',
        'title': 'Dracula',
        'author': 'Bram Stoker',
        'cover': 'https://archive.org/services/img/dracula',
        'description': 'The classic vampire novel that defined the genre.',
        'year': '1897',
        'language': 'English'
    }
]

@api_view(['GET'])
@permission_classes([AllowAny])
def search_books(request):
    """Search Internet Archive for books"""
    query = request.query_params.get('q', '')
    page = int(request.query_params.get('page', 1))
    
    if not query:
        return Response({'results': DEFAULT_BOOKS})
    
    # Internet Archive API
    url = "https://archive.org/advancedsearch.php"
    
    params = {
        'q': f'({query}) AND (mediatype:texts)',
        'fl[]': ['identifier', 'title', 'creator', 'description', 'date', 'language'],
        'sort': 'downloads desc',
        'rows': 24,
        'page': page,
        'output': 'json'
    }
    
    try:
        response = requests.get(url, params=params, timeout=15)
        data = response.json()
        
        results = []
        for doc in data.get('response', {}).get('docs', []):
            identifier = doc.get('identifier', '')
            results.append({
                'id': identifier,
                'title': doc.get('title', 'Untitled'),
                'author': doc.get('creator', 'Unknown Author'),
                'cover': f"https://archive.org/services/img/{identifier}",
                'description': doc.get('description', '')[:300],
                'year': doc.get('date', '')[:4],
                'language': doc.get('language', 'English')
            })
        
        return Response({
            'results': results,
            'total': data.get('response', {}).get('numFound', 0),
            'source': 'internet_archive'
        })
        
    except Exception as e:
        print(f"Internet Archive API error: {e}")
        return Response({'results': DEFAULT_BOOKS})


@api_view(['GET'])
@permission_classes([AllowAny])
def get_book_by_id(request, book_id):
    """Get single book details by ID"""
    try:
        # Fetch metadata from Internet Archive
        url = f"https://archive.org/metadata/{book_id}"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        # Get PDF URL
        pdf_url = f"https://archive.org/download/{book_id}/{book_id}.pdf"
        
        book_data = {
            'id': book_id,
            'title': data.get('metadata', {}).get('title', 'Untitled'),
            'author': data.get('metadata', {}).get('creator', 'Unknown Author'),
            'cover': f"https://archive.org/services/img/{book_id}",
            'description': data.get('metadata', {}).get('description', 'No description available'),
            'year': data.get('metadata', {}).get('date', '')[:4],
            'language': data.get('metadata', {}).get('language', 'English'),
            'embed_url': pdf_url,
            'source_url': f"https://archive.org/details/{book_id}"
        }
        
        return Response(book_data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_for_later(request):
    """Save book to Read Later list"""
    serializer = SaveBookSerializer(data=request.data)
    
    if serializer.is_valid():
        data = serializer.validated_data
        
        existing = SavedBook.objects.filter(
            user=request.user,
            book_id=data['book_id']
        ).first()
        
        if existing:
            return Response({
                'message': 'Already in your Read Later list',
                'book': SavedBookSerializer(existing).data
            })
        
        saved = SavedBook.objects.create(
            user=request.user,
            book_id=data['book_id'],
            title=data['title'],
            author=data.get('author', ''),
            embed_url=data['embed_url'],
            source_url=data['source_url'],
            thumbnail=data.get('thumbnail', ''),
            description=data.get('description', ''),
            year=data.get('year', ''),
            language=data.get('language', '')
        )
        
        return Response({
            'message': 'Added to Read Later! 📖',
            'book': SavedBookSerializer(saved).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_read_later(request):
    """Get user's Read Later list"""
    books = SavedBook.objects.filter(user=request.user)
    serializer = SavedBookSerializer(books, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_read_later(request, book_id):
    """Remove book from Read Later list"""
    try:
        book = SavedBook.objects.get(user=request.user, book_id=book_id)
        book.delete()
        return Response({'message': 'Removed from Read Later'})
    except SavedBook.DoesNotExist:
        return Response({'error': 'Book not found'}, status=404)
