from django.core.management.base import BaseCommand
from api.models import Company, User

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        # Criar empresas
        magazine, _ = Company.objects.get_or_create(
            name='Magazine TORRA',
            slug='magazine-torra'
        )
        nipo, _ = Company.objects.get_or_create(
            name='NIPO',
            slug='nipo'
        )
        
        # Criar usuários
        User.objects.create_user(
            username='magazine',
            password='demo123',
            email='contato@magazinetorra.com',
            company=magazine
        )
        
        User.objects.create_user(
            username='nipo',
            password='demo123',
            email='contato@nipo.com',
            company=nipo
        )
        
        self.stdout.write(self.style.SUCCESS('Dados criados com sucesso!'))