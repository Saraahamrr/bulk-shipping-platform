# backend/shipping/management/commands/seed_data.py
from django.core.management.base import BaseCommand
from shipping.models import SavedAddress, SavedPackage

class Command(BaseCommand):
    help = 'Seed database with initial data'
    
    def handle(self, *args, **kwargs):
        # Seed saved addresses
        addresses = [
            {
                'name': 'Print TTS - San Dimas',
                'first_name': 'Print',
                'last_name': 'TTS',
                'address_line1': '502 W Arrow Hwy',
                'address_line2': 'STE P',
                'city': 'San Dimas',
                'state': 'CA',
                'zip_code': '91773',
                'phone': '909-123-4567'
            },
            {
                'name': 'Print TTS - Claremont',
                'first_name': 'Print',
                'last_name': 'TTS',
                'address_line1': '500 W Foothill Blvd',
                'address_line2': 'STE P',
                'city': 'Claremont',
                'state': 'CA',
                'zip_code': '91711',
                'phone': '909-234-5678'
            },
            {
                'name': 'Print TTS - Ontario',
                'first_name': 'Print',
                'last_name': 'TTS',
                'address_line1': '1170 Grove Ave',
                'address_line2': '',
                'city': 'Ontario',
                'state': 'CA',
                'zip_code': '91764',
                'phone': '909-345-6789'
            }
        ]
        
        for addr in addresses:
            SavedAddress.objects.get_or_create(
                name=addr['name'],
                defaults=addr
            )
        
        self.stdout.write(self.style.SUCCESS(f'Seeded {len(addresses)} addresses'))
        
        # Seed saved packages
        packages = [
            {
                'name': 'Light Package',
                'length': 6,
                'width': 6,
                'height': 6,
                'weight_lbs': 1,
                'weight_oz': 0
            },
            {
                'name': '8 Oz Item',
                'length': 4,
                'width': 4,
                'height': 4,
                'weight_lbs': 0,
                'weight_oz': 8
            },
            {
                'name': 'Standard Box',
                'length': 12,
                'width': 12,
                'height': 12,
                'weight_lbs': 2,
                'weight_oz': 0
            }
        ]
        
        for pkg in packages:
            SavedPackage.objects.get_or_create(
                name=pkg['name'],
                defaults=pkg
            )
        
        self.stdout.write(self.style.SUCCESS(f'Seeded {len(packages)} packages'))