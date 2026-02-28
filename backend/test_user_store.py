import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.serializers import UserSerializer
from stores.models import Store
from accounts.models import User

def test_user_creation_with_store():
    print("--- Testando Criação de Usuário com Store via Serializer ---")
    try:
        store = Store.objects.first()
        if not store:
            print("Crie uma loja primeiro!")
            return
            
        # Data without store (frontend style)
        data = {
            'whatsapp': '99999999999',
            'first_name': 'Test',
            'last_name': 'Operator',
            'role': 'VENDEDOR'
        }
        
        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            # Simulate MultiTenantViewSet.perform_create
            user = serializer.save(store=store)
            print(f"✅ Usuário criado: {user.whatsapp}")
            print(f"Loja vinculada: {user.store}")
            if user.store == store:
                print("✨ O vínculo está funcionando corretamente!")
            else:
                print("❌ O vínculo falhou!")
            
            # Cleanup
            user.delete()
        else:
            print("❌ Erros de validação:", serializer.errors)
            
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    test_user_creation_with_store()
