# digital_library/admin.py

from django.contrib import admin
from .models import Faculty, Department, Book, Bookmark, RecentView, SearchHistory

@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'icon', 'is_active', 'display_order']
    list_editable = ['display_order', 'is_active']
    search_fields = ['name', 'code']

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'faculty', 'is_active', 'display_order']
    list_filter = ['faculty', 'is_active']
    list_editable = ['display_order', 'is_active']
    search_fields = ['name', 'code', 'search_subjects']

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'publisher', 'view_count', 'is_featured', 'created_at']
    list_filter = ['language', 'is_featured']
    search_fields = ['title', 'authors', 'publisher']
    list_editable = ['is_featured']
    filter_horizontal = ['departments']

@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ['user', 'book', 'created_at']
    search_fields = ['user__username', 'book__title']

@admin.register(RecentView)
class RecentViewAdmin(admin.ModelAdmin):
    list_display = ['user', 'book', 'viewed_at']

@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'query', 'result_count', 'searched_at']