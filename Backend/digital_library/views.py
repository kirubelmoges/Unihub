# digital_library/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, Count
from django.http import HttpResponse
from django.utils import timezone
import requests
import time
from .models import Book, Bookmark, RecentView, SearchHistory, Department
from .serializers import BookSerializer, BookmarkSerializer, RecentViewSerializer, SearchHistorySerializer
from .doab_client import doab_client

class BookViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BookSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return Book.objects.all()
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Comprehensive search - searches ALL fields"""
        query = request.query_params.get('q', '').strip()
        limit = int(request.query_params.get('limit', 20))
        
        if not query:
            return Response({'results': [], 'total': 0})
        
        if request.user.is_authenticated:
            SearchHistory.objects.create(user=request.user, query=query)
        
        # Search in database first
        db_books = Book.objects.filter(
            Q(title__icontains=query) |
            Q(subtitle__icontains=query) |
            Q(authors__icontains=query) |
            Q(subjects__icontains=query) |
            Q(publisher__icontains=query) |
            Q(abstract__icontains=query)
        ).distinct()[:limit]
        
        if db_books.count() >= limit:
            serializer = BookSerializer(db_books, many=True)
            return Response({
                'results': serializer.data,
                'total': db_books.count(),
                'source': 'database'
            })
        
        # Search DOAB if needed
        try:
            results = doab_client.search_and_cache(query, limit)
            all_books = list(db_books)
            existing_ids = set(book.id for book in all_books)
            
            for book in results.get('books', []):
                if book.id not in existing_ids:
                    all_books.append(book)
            
            serializer = BookSerializer(all_books[:limit], many=True)
            return Response({
                'results': serializer.data,
                'total': len(all_books),
                'source': 'mixed'
            })
        except Exception as e:
            return Response({
                'results': serializer.data if db_books else [],
                'total': db_books.count(),
                'source': 'database',
                'error': str(e)
            })
    
    @action(detail=False, methods=['get'])
    def search_by_title(self, request):
        """Search by title only"""
        title = request.query_params.get('title', '').strip()
        limit = int(request.query_params.get('limit', 20))
        
        if not title:
            return Response({'results': [], 'total': 0})
        
        books = Book.objects.filter(title__icontains=title)[:limit]
        serializer = BookSerializer(books, many=True)
        return Response({
            'results': serializer.data,
            'total': books.count(),
            'search_type': 'title'
        })
    
    @action(detail=False, methods=['get'])
    def search_by_author(self, request):
        """Search by author only"""
        author = request.query_params.get('author', '').strip()
        limit = int(request.query_params.get('limit', 20))
        
        if not author:
            return Response({'results': [], 'total': 0})
        
        books = Book.objects.filter(authors__icontains=author)[:limit]
        serializer = BookSerializer(books, many=True)
        return Response({
            'results': serializer.data,
            'total': books.count(),
            'search_type': 'author'
        })
    
    @action(detail=False, methods=['get'])
    def search_by_subject(self, request):
        """Search by subject only"""
        subject = request.query_params.get('subject', '').strip()
        limit = int(request.query_params.get('limit', 20))
        
        if not subject:
            return Response({'results': [], 'total': 0})
        
        if request.user.is_authenticated:
            SearchHistory.objects.create(user=request.user, query=f"subject:{subject}")
        
        db_books = Book.objects.filter(subjects__icontains=subject)[:limit]
        
        if db_books.count() >= limit:
            serializer = BookSerializer(db_books, many=True)
            return Response({
                'results': serializer.data,
                'total': db_books.count(),
                'source': 'database'
            })
        
        try:
            results = doab_client.search_and_cache_by_subject(subject, limit)
            serializer = BookSerializer(results.get('books', []), many=True)
            return Response({
                'results': serializer.data,
                'total': results.get('total', 0),
                'subject': subject
            })
        except Exception as e:
            return Response({
                'results': [],
                'total': 0,
                'error': str(e)
            })
    
    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        """Track book view"""
        if not request.user.is_authenticated:
            return Response({'error': 'Login required'}, status=401)
        
        book = self.get_object()
        book.increment_view_count()
        
        RecentView.objects.update_or_create(
            user=request.user,
            book=book,
            defaults={'viewed_at': timezone.now()}
        )
        
        return Response({'status': 'recorded'})
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download book with redirect following"""
        book = self.get_object()
        format_type = request.query_params.get('format', 'pdf')
        
        download_url = book.get_download_url(format_type)
        
        if not download_url:
            return Response({'error': 'No download URL available'}, status=404)
        
        try:
            # Follow redirects to get the actual PDF
            response = requests.get(download_url, stream=True, allow_redirects=True, timeout=30)
            response.raise_for_status()
            
            # Create HTTP response with file
            http_response = HttpResponse(response.content, content_type='application/pdf')
            http_response['Content-Disposition'] = f'attachment; filename="{book.title[:50]}.{format_type}"'
            return http_response
            
        except requests.exceptions.Timeout:
            return Response({'error': 'Download timeout. Please try again.'}, status=408)
        except requests.exceptions.ConnectionError:
            return Response({'error': 'Connection error. Please try again later.'}, status=503)
        except Exception as e:
            # Return URL for frontend fallback
            return Response({
                'download_url': download_url,
                'book_id': str(book.id),
                'book_title': book.title,
                'error': str(e)
            })

class BookmarkViewSet(viewsets.ModelViewSet):
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_bookmarks(self, request):
        bookmarks = self.get_queryset()
        serializer = self.get_serializer(bookmarks, many=True)
        return Response(serializer.data)

class RecentViewViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecentViewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return RecentView.objects.filter(user=self.request.user)[:20]

class SearchHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SearchHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SearchHistory.objects.filter(user=self.request.user)[:50]

@api_view(['GET'])
def get_departments(request):
    """Get all departments for frontend"""
    departments = Department.objects.filter(is_active=True).select_related('faculty')
    data = {}
    for dept in departments:
        faculty_code = dept.faculty.code
        if faculty_code not in data:
            data[faculty_code] = {
                'id': dept.faculty.code,
                'name': dept.faculty.name,
                'icon': dept.faculty.icon,
                'color': dept.faculty.color,
                'departments': []
            }
        data[faculty_code]['departments'].append({
            'id': dept.code,
            'name': dept.name,
            'icon': dept.icon,
            'bookCount': dept.books.count(),
            'searchSubjects': dept.get_search_subjects_list()
        })
    return Response(list(data.values()))

@api_view(['GET'])
def get_popular_books(request):
    """Get most popular books"""
    books = Book.objects.annotate(
        bookmark_count=Count('bookmarked_by')
    ).order_by('-bookmark_count', '-view_count')[:20]
    
    serializer = BookSerializer(books, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_continue_reading(request):
    """Get books user was reading"""
    if not request.user.is_authenticated:
        return Response([])
    
    recent = RecentView.objects.filter(
        user=request.user
    ).select_related('book').order_by('-viewed_at')[:10]
    
    books = [rv.book for rv in recent]
    serializer = BookSerializer(books, many=True)
    return Response(serializer.data)