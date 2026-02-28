import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from products.serializers import ProductSerializer
from products.models import Product
from rest_framework.exceptions import ValidationError

def test_serializer_fixes():
    print("=== Testando Serializer de Produtos (Fix Erro 400) ===")
    
    # Required fields base
    base_data = {
        "name": "Produto Teste",
        "price": 10.0,
        "stock": 5,
        "stock_min": 1,
        "sku": "SKU-TESTE-123"
    }

    test_cases = [
        {"name": "Caso 1: 'none' string", "data": {**base_data, "category": "none", "supplier": "none"}},
        {"name": "Caso 2: 'null' string", "data": {**base_data, "category": "null", "supplier": "null"}},
        {"name": "Caso 3: empty string", "data": {**base_data, "category": "", "supplier": ""}},
    ]
    
    for case in test_cases:
        print(f"\n{case['name']}...")
        serializer = ProductSerializer(data=case['data'])
        try:
            # Check validation
            if serializer.is_valid():
                internal_data = serializer.validated_data
                cat_val = internal_data.get('category')
                sup_val = internal_data.get('supplier')
                
                print(f"Validado -> Category: {cat_val}, Supplier: {sup_val}")
                
                if cat_val is None and sup_val is None:
                    print("✅ SUCESSO: Valores convertidos para None e validados!")
                else:
                    print(f"❌ FALHA: Conversão resultou em {cat_val}/{sup_val}")
            else:
                print(f"❌ FALHA de Validação: {serializer.errors}")

        except Exception as e:
            print(f"❌ ERRO Inesperado: {e}")

    print("\n=== Fim do Teste ===")

if __name__ == "__main__":
    test_serializer_fixes()
