import os
import django
import sys
import json
from django.http import QueryDict

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from products.serializers import ProductSerializer
from products.models import Product

def test_serializer_with_p13():
    print("--- Testando Serializer com Dados Similares ao Frontend ---")
    try:
        p = Product.objects.get(id=13)
        
        # Simulate QueryDict (as DRF receives from Multipart)
        raw_data = {
            'name': 'Café Espresso 50ml Edit',
            'sku': 'ESP001',
            'price': '4.50',
            'stock': '962',
            'min_stock': '10',
            'is_active': 'true',
            'category': '4'
        }
        
        # Create QueryDict
        q_data = QueryDict('', mutable=True)
        for k, v in raw_data.items():
            q_data[k] = v
            
        print("Payload (QueryDict):", q_data)

        # Test partial update
        serializer = ProductSerializer(p, data=q_data, partial=True)
        if serializer.is_valid():
            print("✅ Serializer é VALIDO!")
            print("Dados validados:", serializer.validated_data)
        else:
            print("❌ Serializer é INVALIDO!")
            print("Erros:", serializer.errors)

        # Test with 'none' fields
        print("\n--- Testando com 'none' fields ---")
        raw_data['category'] = 'none'
        q_data = QueryDict('', mutable=True)
        for k, v in raw_data.items():
            q_data[k] = v
            
        serializer = ProductSerializer(p, data=q_data, partial=True)
        if serializer.is_valid():
            print("✅ Serializer é VALIDO com 'none'!")
        else:
            print("❌ Serializer é INVALIDO com 'none'!")
            print("Erros:", serializer.errors)

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Erro: {e}")

if __name__ == "__main__":
    test_serializer_with_p13()
