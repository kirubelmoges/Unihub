# digital_library/serializers.py

from rest_framework import serializers
from .models import Book, Bookmark, RecentView, SearchHistory

class BookSerializer(serializers.ModelSerializer):
    all_authors = serializers.ReadOnlyField()
    publication_year = serializers.ReadOnlyField()
    
    class Meta:
        model = Book
        fields = [
            'id', 'title', 'subtitle', 'authors', 'all_authors',
            'subjects', 'publisher', 'publication_date', 'publication_year',
            'language', 'abstract', 'pdf_url', 'epub_url', 'cover_url',
            'view_count', 'is_featured', 'created_at'
        ]

class BookmarkSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    book_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Bookmark
        fields = ['id', 'user', 'book', 'book_id', 'notes', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class RecentViewSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    
    class Meta:
        model = RecentView
        fields = ['id', 'book', 'viewed_at']

class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = ['id', 'query', 'result_count', 'searched_at']