import os
import django
import sys
from unittest.mock import MagicMock

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.views import UserViewSet
from accounts.models import User
from stores.models import Store
from rest_framework.test import APIRequestFactory, force_authenticate

def test_tenant_context_creation():
    print("--- Testando Criação de Operador com Contexto de Loja (X-Store-ID) ---")
    factory = APIRequestFactory()
    
    # 1. Setup Data
    admin_user = User.objects.filter(role='ADMIN').first()
    if not admin_user:
        print("Crie um admin primeiro!")
        return
        
    target_store = Store.objects.exclude(id=admin_user.store_id).first()
    if not target_store:
        # Create a second store if only one exists
        target_store = Store.objects.create(name="Loja de Teste 2", whatsapp="11999999999")
        print(f"Criada loja de teste: {target_store.name}")

    print(f"Admin Store: {admin_user.store.name}")
    print(f"Target Store: {target_store.name}")

    # 2. Simulate Request
    view = UserViewSet.as_view({'post': 'create'})
    data = {
        'whatsapp': '5511988887777',
        'first_name': 'Operador',
        'last_name': 'Tenant Test',
        'role': 'VENDEDOR'
    }
    
    # Request with X-Store-ID
    request = factory.post('/api/users/', data, format='json', HTTP_X_STORE_ID=str(target_store.id))
    force_authenticate(request, user=admin_user)
    
    response = view(request)
    
    if response.status_code == 201:
        new_user = User.objects.get(whatsapp='5511988887777')
        print(f"✅ Usuário criado com sucesso!")
        print(f"Loja atribuída no BD: {new_user.store.name}")
        
        if new_user.store_id == target_store.id:
            print("✨ SUCESSO: O usuário foi vinculado à loja do Header X-Store-ID, não à do Admin!")
        else:
            print(f"❌ FALHA: O usuário foi vinculado à loja {new_user.store.name} (esperado: {target_store.name})")
            
        # Cleanup
        new_user.delete()
    else:
        print(f"❌ Erro na criação: {response.status_code} - {response.data}")

if __name__ == "__main__":
    test_tenant_context_creation()
