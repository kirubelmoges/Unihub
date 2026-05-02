# digital_library/doab_client.py

import requests
from datetime import datetime
from django.core.cache import cache
from django.utils import timezone
import hashlib
import time

class DOABClient:
    """DOAB API Client with Full PDF and Cover Image Support"""
    
    BASE_URL = "https://directory.doabooks.org/rest/search"
    DOAB_BASE = "https://directory.doabooks.org"
    
    def __init__(self):
        self.headers = {
            'Accept': 'application/json',
            'User-Agent': 'DigitalLibrary/1.0'
        }
        self.request_delay = 1  # Delay between requests to avoid rate limiting
    
    def _search(self, query, limit=20, offset=0):
        """Internal search method with rate limiting"""
        cache_key = f'doab_{query.replace(" ", "_")}_{limit}_{offset}'
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
        
        url = f"{self.BASE_URL}?query={query}&limit={limit}&offset={offset}&expand=metadata,bitstreams"
        
        try:
            # Add delay to avoid rate limiting
            time.sleep(self.request_delay)
            
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            if isinstance(result, list):
                wrapped = {'items': result, 'total': len(result)}
                cache.set(cache_key, wrapped, 3600)
                return wrapped
            return {'items': [], 'total': 0}
        except Exception as e:
            print(f"DOAB API error: {e}")
            return {'items': [], 'total': 0}
    
    def make_absolute_url(self, url):
        """Convert relative URLs to absolute URLs"""
        if not url:
            return ''
        if url.startswith('http://') or url.startswith('https://'):
            return url
        if url.startswith('/'):
            return f"{self.DOAB_BASE}{url}"
        return f"{self.DOAB_BASE}/{url}"
    
    def verify_and_follow_redirect(self, url):
        """Follow redirects to get the final working URL"""
        if not url:
            return ''
        
        try:
            response = requests.head(url, timeout=15, allow_redirects=True)
            if response.status_code == 200:
                return response.url
            elif response.status_code in [301, 302, 303, 307, 308]:
                final_url = response.headers.get('Location', '')
                if final_url:
                    if final_url.startswith('/'):
                        final_url = f"{self.DOAB_BASE}{final_url}"
                    return final_url
        except Exception as e:
            print(f"URL verification error: {e}")
        
        return url
    
    def generate_placeholder_cover(self, title):
        """Generate a beautiful placeholder cover image"""
        # Generate consistent color based on title
        hash_val = int(hashlib.md5(title.encode()).hexdigest()[:8], 16)
        colors = ['4F46E5', '7C3AED', 'EC4899', 'F59E0B', '10B981', '3B82F6', 'EF4444', '06B6D4']
        color = colors[hash_val % len(colors)]
        
        # Clean title for URL
        clean_title = title.replace(' ', '+')[:40]
        return f"https://via.placeholder.com/200x300/{color}/FFFFFF?text={clean_title}"
    
    def extract_pdf_url(self, bitstreams, handle, title=""):
        """Extract and verify PDF URL - returns working absolute URL"""
        pdf_url = None
        
        # Common patterns for PDF files
        pdf_patterns = ['pdf', 'fulltext', 'download', 'full text', 'articulo', 'libro', 'chapter']
        
        # Method 1: Search bitstreams
        for bs in bitstreams:
            bundle = bs.get('bundleName', '').upper()
            mime = bs.get('mimeType', '').lower()
            url = bs.get('url', '')
            link = bs.get('link', '')
            name = bs.get('name', '').lower()
            
            if 'pdf' in mime:
                pdf_url = url if url else link
                break
            if bundle == 'PDF':
                pdf_url = url if url else link
                break
            for pattern in pdf_patterns:
                if pattern in name:
                    pdf_url = url if url else link
                    break
            if pdf_url:
                break
            if link and '.pdf' in link.lower():
                pdf_url = link
                break
        
        # Method 2: Construct from handle
        if not pdf_url and handle:
            clean_handle = handle.replace('https://directory.doabooks.org/handle/', '')
            test_urls = [
                f"/bitstream/{clean_handle}/1/Fulltext.pdf",
                f"/bitstream/{clean_handle}/1/PDF/Fulltext.pdf",
                f"/bitstream/{clean_handle}/1/fulltext.pdf",
                f"/bitstream/{clean_handle}/1/download.pdf",
            ]
            for test_url in test_urls:
                full_url = self.make_absolute_url(test_url)
                verified_url = self.verify_and_follow_redirect(full_url)
                if verified_url and verified_url != full_url:
                    pdf_url = verified_url
                    break
        
        if pdf_url:
            pdf_url = self.make_absolute_url(pdf_url)
            pdf_url = self.verify_and_follow_redirect(pdf_url)
        
        return pdf_url if pdf_url else ''
    
    def extract_cover_url(self, bitstreams, handle, title=""):
        """Extract cover image URL - returns working absolute URL or placeholder"""
        cover_url = ''
        image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
        
        for bs in bitstreams:
            mime = bs.get('mimeType', '').lower()
            url = bs.get('url', '')
            name = bs.get('name', '').lower()
            
            if 'image' in mime:
                cover_url = url
                break
            for ext in image_extensions:
                if name.endswith(ext) or (url and url.endswith(ext)):
                    cover_url = url
                    break
            if cover_url:
                break
        
        if cover_url:
            cover_url = self.make_absolute_url(cover_url)
            cover_url = self.verify_and_follow_redirect(cover_url)
        
        # Return placeholder if no cover found
        if not cover_url and title:
            cover_url = self.generate_placeholder_cover(title)
        
        return cover_url
    
    def parse_book(self, item):
        """Parse book data with full PDF and cover extraction"""
        try:
            metadata_list = item.get('metadata', [])
            
            # Convert metadata to dict
            metadata = {}
            for meta in metadata_list:
                key = meta.get('key')
                value = meta.get('value')
                if key and value:
                    metadata[key] = value
            
            # Skip non-books
            if 'grant' in metadata.get('dc.type', '').lower():
                return None
            
            # Extract title
            title = ''
            for title_field in ['dc.title', 'title', 'dcterms.title', 'name']:
                if title_field in metadata:
                    title_val = metadata[title_field]
                    if isinstance(title_val, list):
                        title = title_val[0] if title_val else ''
                    else:
                        title = title_val
                    if title:
                        break
            
            if not title or len(title) < 3:
                return None
            
            # Extract authors
            authors = []
            for author_field in ['dc.creator', 'creator', 'dc.contributor.author', 'author']:
                if author_field in metadata:
                    creator_val = metadata[author_field]
                    if isinstance(creator_val, list):
                        authors = [str(a) for a in creator_val if a]
                    else:
                        authors = [str(creator_val)]
                    if authors:
                        break
            
            # Extract subjects
            subjects = []
            for subject_field in ['dc.subject', 'subject', 'keywords', 'dcterms.subject']:
                if subject_field in metadata:
                    subj_val = metadata[subject_field]
                    if isinstance(subj_val, list):
                        subjects = [str(s) for s in subj_val if s]
                    else:
                        subjects = [str(subj_val)]
                    if subjects:
                        break
            
            # Extract publisher
            publisher = ''
            for pub_field in ['dc.publisher', 'publisher', 'dcterms.publisher']:
                if pub_field in metadata:
                    pub_val = metadata[pub_field]
                    if isinstance(pub_val, list):
                        publisher = pub_val[0] if pub_val else ''
                    else:
                        publisher = pub_val
                    if publisher:
                        break
            
            # Extract PDF URL and Cover Image
            handle = item.get('handle', '')
            bitstreams = item.get('bitstreams', [])
            
            pdf_url = self.extract_pdf_url(bitstreams, handle, title)
            cover_url = self.extract_cover_url(bitstreams, handle, title)
            
            return {
                'doab_id': str(item.get('uuid', item.get('handle'))),
                'handle': handle,
                'title': title[:500],
                'subtitle': '',
                'authors': authors[:5],
                'subjects': subjects[:10],
                'publisher': publisher[:300],
                'publication_date': metadata.get('dc.date', '')[:10],
                'language': metadata.get('dc.language', 'en')[:10],
                'abstract': metadata.get('dc.description', '')[:5000],
                'pdf_url': pdf_url,
                'epub_url': '',
                'cover_url': cover_url,
                'license_info': '',
            }
        except Exception as e:
            print(f"Parse error: {e}")
            return None
    
    def comprehensive_search(self, term, limit=20, offset=0):
        """Search using ALL possible fields"""
        search_queries = [
            f'dc.title:"{term}"',
            f'dc.subject:"{term}"',
            f'dc.creator:"{term}"',
            f'dc.description:"{term}"',
            f'"{term}"',
            term
        ]
        
        all_items = []
        used_ids = set()
        
        for query in search_queries:
            result = self._search(query, limit, offset)
            items = result.get('items', [])
            
            for item in items:
                item_id = item.get('uuid', item.get('handle'))
                if item_id and item_id not in used_ids:
                    used_ids.add(item_id)
                    all_items.append(item)
            
            if len(all_items) >= limit:
                break
        
        return {'items': all_items[:limit], 'total': len(all_items)}
    
    def search_and_cache(self, query, limit=20, offset=0):
        """Search and cache in database"""
        from .models import Book
        
        api_result = self.comprehensive_search(query, limit)
        items = api_result.get('items', [])
        
        books = []
        for item in items:
            book_data = self.parse_book(item)
            if book_data:
                try:
                    book, created = Book.objects.update_or_create(
                        doab_id=book_data['doab_id'],
                        defaults={**book_data, 'last_cached': timezone.now()}
                    )
                    books.append(book)
                except Exception as e:
                    print(f"Save error: {e}")
        
        return {'books': books, 'total': len(books)}
    
    def search_and_cache_by_subject(self, subject, limit=20):
        """Search by subject and cache in database"""
        return self.search_and_cache(subject, limit)
    
    def populate_department(self, department, limit_per_term=15):
        """Populate books for a department"""
        from .models import Book
        
        subjects = department.get_search_subjects_list()
        all_books = []
        
        print(f"\n📚 Populating {department.name}:")
        
        for subject in subjects[:5]:
            print(f"   🔍 Searching for: {subject}")
            result = self.comprehensive_search(subject, limit_per_term)
            items = result.get('items', [])
            
            for item in items:
                book_data = self.parse_book(item)
                if book_data:
                    try:
                        book, created = Book.objects.update_or_create(
                            doab_id=book_data['doab_id'],
                            defaults={**book_data, 'last_cached': timezone.now()}
                        )
                        if created:
                            book.departments.add(department)
                            all_books.append(book)
                    except Exception as e:
                        print(f"      ❌ Error: {e}")
        
        print(f"   📊 Total added: {len(all_books)} books")
        return all_books

doab_client = DOABClient()