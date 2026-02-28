import os
import django
import sys
import json

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from products.models import Product
from products.serializers import ProductSerializer

def inspect_product_13():
    try:
        p = Product.objects.get(id=13)
        print(f"--- Produto {p.id} ---")
        print(f"Nome: {p.name}")
        print(f"SKU: {p.sku}")
        print(f"Preço: {p.price}")
        print(f"Estoque: {p.stock}")
        print(f"Min Estoque: {p.min_stock}")
        print(f"Categoria: {p.category}")
        print(f"Fornecedor: {p.supplier}")
        print(f"Ativo: {p.is_active}")
        
        # Test serialization
        serializer = ProductSerializer(p)
        print("\n--- Serialized Data ---")
        print(json.dumps(serializer.data, indent=2))
        
    except Product.DoesNotExist:
        print("Produto 13 não encontrado!")
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    inspect_product_13()
