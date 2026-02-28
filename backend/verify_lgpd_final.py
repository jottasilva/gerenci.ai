import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from customers.models import Customer
from stores.models import Store
from core.models import DataAccessLog
from django.contrib.auth import get_user_model
from core.crypto import decrypt_value

User = get_user_model()

def verify_lgpd():
    print("=== Verificação LGPD Gerenc.AI ===")
    
    # 0. Setup dependencies
    store, _ = Store.objects.get_or_create(
        whatsapp='5511000000000',
        defaults={'name': 'Loja de Teste LGPD'}
    )
    
    test_user, _ = User.objects.get_or_create(
        whatsapp='5500000000000',
        defaults={'first_name': 'Auditor', 'is_staff': True, 'store': store}
    )

    cust = None

    # 1. Test Encryption
    print("\n[1] Verificando Criptografia...")
    try:
        # Get or create a test customer
        cust, created = Customer.objects.update_or_create(
            whatsapp='5511999998888',
            store=store,
            defaults={
                'name': 'Cliente Teste LGPD',
                'cpf_cnpj': '123.456.789-00',
                'privacy_accepted': True
            }
        )
        
        # Access the raw DB value
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT cpf_cnpj FROM customers_customer WHERE whatsapp = %s AND store_id = %s", [cust.whatsapp, store.id])
            raw_val = cursor.fetchone()[0]
        
        print(f"Nome: {cust.name}")
        print(f"CPF (via Model): {cust.cpf_cnpj}")
        print(f"CPF (via SQL direto no DB): {raw_val}")
        
        if raw_val == '123.456.789-00':
            print("❌ FALHA: O CPF está em texto claro no banco de dados!")
        elif len(raw_val) > 40: 
            print("✅ SUCESSO: O CPF está criptografado no banco de dados.")
        else:
            print(f"⚠️ AVISO: Valor no banco parece estranho: {raw_val}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ ERRO na verificação de criptografia: {e}")

    # 2. Test Data Access Logging
    print("\n[2] Verificando Logs de Acesso...")
    try:
        if not cust:
            print("❌ ABORTANDO LOGS: Cliente não foi criado.")
        else:
            from core.audit import log_data_access
            
            # Mock a request object
            class MockRequest:
                def __init__(self, user):
                    self.user = user
                    self.META = {'HTTP_USER_AGENT': 'Verification Script', 'REMOTE_ADDR': '127.0.0.1'}

            request = MockRequest(test_user)

            log_data_access(
                request=request,
                action='VIEW',
                resource_type='customer',
                resource_id=str(cust.whatsapp),
                details={'fields': 'cpf_cnpj'}
            )
            
            last_log = DataAccessLog.objects.filter(resource_type='customer').first()
            if last_log:
                print(f"Log encontrado: {last_log.user} acessou {last_log.resource_type}/{last_log.resource_id} via {last_log.action}")
                print(f"IP: {last_log.ip_address} | Detalhes: {last_log.details}")
                print("✅ SUCESSO: Log de acesso registrado corretamente.")
            else:
                print("❌ FALHA: Log de acesso não encontrado.")
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ ERRO na verificação de logs: {e}")

    print("\n=== Fim da Verificação ===")

if __name__ == "__main__":
    verify_lgpd()
