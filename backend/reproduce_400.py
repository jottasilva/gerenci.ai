import os
import django
import sys
import json
from django.test import RequestFactory
from rest_framework.request import Request

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from products.views import ProductViewSet
from products.models import Product
from accounts.models import User
from stores.models import Store

def simulate_patch_13():
    print("--- Simulando PATCH Produto 13 ---")
    try:
        store = Store.objects.first()
        user = User.objects.filter(store=store).first()
        if not user:
            print("Usuário não encontrado.")
            return

        # Prepare payload like the frontend
        # Uses Multipart format (FormData in browser)
        payload = {
            'name': 'Café Espresso 50ml Edit',
            'sku': 'ESP001',
            'price': '4.50',
            'stock': '962',
            'min_stock': '10',
            'is_active': 'true',
            'category': '4' # Café
        }

        factory = RequestFactory()
        # DRF expects a request object
        url = f'/api/products/13/'
        request = factory.patch(url, data=payload) # This creates a POST-like body for PATCH
        request.user = user
        
        # We need to wrap it in DRF Request
        from rest_framework.parsers import MultiPartParser
        drf_request = Request(request, parsers=[MultiPartParser()])
        
        view = ProductViewSet.as_view({'patch': 'partial_update'})
        response = view(request, pk=13)
        
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Errors: {response.data}")
        else:
            print("Sucesso!")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Erro: {e}")

if __name__ == "__main__":
    simulate_patch_13()
