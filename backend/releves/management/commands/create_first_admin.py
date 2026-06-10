from django.core.management.base import BaseCommand
from django.conf import settings
from releves.models import User


class Command(BaseCommand):
    help = 'Seeds the first admin account defined in settings (idempotent).'

    def handle(self, *args, **options):
        email = settings.FIRST_ADMIN_EMAIL
        if User.objects.filter(email=email).exists():
            self.stdout.write(f'Admin «{email}» already exists — skipping.')
            return
        User.objects.create_user(
            email=email,
            full_name=settings.FIRST_ADMIN_NAME,
            password=settings.FIRST_ADMIN_PASSWORD,
            role=User.ADMIN,
            is_staff=True,
        )
        self.stdout.write(self.style.SUCCESS(f'✅ Admin créé: {email}'))
