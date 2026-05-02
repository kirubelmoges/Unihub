# digital_library/management/commands/smart_populate.py

from django.core.management.base import BaseCommand
from digital_library.models import Faculty, Department
from digital_library.doab_client import doab_client

class Command(BaseCommand):
    help = 'Smart populate books by department subjects'
    
    def add_arguments(self, parser):
        parser.add_argument('--faculty', type=str, help='Populate specific faculty by code')
        parser.add_argument('--department', type=str, help='Populate specific department by code')
        parser.add_argument('--limit', type=int, default=15, help='Books per subject')
    
    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("📚 SMART POPULATING BOOKS BY DEPARTMENT SUBJECTS")
        self.stdout.write("=" * 60)
        
        departments = Department.objects.filter(is_active=True)
        
        if options['faculty']:
            departments = departments.filter(faculty__code=options['faculty'])
        if options['department']:
            departments = departments.filter(code=options['department'])
        
        total_books = 0
        
        for dept in departments:
            books = doab_client.populate_department(dept, options['limit'])
            total_books += len(books)
        
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS(f"✨ COMPLETE! Total books added: {total_books}"))
        self.stdout.write("=" * 60)