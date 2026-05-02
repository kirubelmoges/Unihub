from django.core.management.base import BaseCommand
from exam_ai.models import cleanup_expired_exams

class Command(BaseCommand):
    help = 'Clean up expired temporary exams'

    def handle(self, *args, **options):
        result = cleanup_expired_exams()
        self.stdout.write(self.style.SUCCESS(result))