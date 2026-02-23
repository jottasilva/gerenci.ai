import os
import django
import sys

# Add current directory to path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import User
from stores.models import Store
from products.models import Product
from orders.views import OrderViewSet
from rest_framework.test import APIRequestFactory, force_authenticate
import json

def test():
    print("Iniciando teste de criação de pedido...")
    user = User.objects.filter(role='ADMIN').first()
    if not user:
        user = User.objects.first()
    
    if not user:
        print("Nenhum usuário encontrado.")
        return

    store = user.store
    if not store:
        store = Store.objects.first()
        if store:
            user.store = store
            user.save()
        else:
            print("Nenhuma loja encontrada.")
            return

    product = Product.objects.filter(store=store).first()
    if not product:
        print("Criando produto de teste...")
        from products.models import Category
        cat, _ = Category.objects.get_or_create(store=store, name='Teste')
        product = Product.objects.create(store=store, name='Teste', price=10.0, stock=100, category=cat)

    factory = APIRequestFactory()
    view = OrderViewSet.as_view({'post': 'create'})
    
    payload = {
        'customer': None,
        'customer_name_manual': 'Balcão',
        'total': 10.0,
        'discount': 0,
        'forma_pagto': 'DINHEIRO',
        'payment_method': 'DINHEIRO',
        'status': 'FINALIZADO',
        'received_amount': 10.0,
        'change_amount': 0.0,
        'delivery_method': 'BALCAO',
        'delivery_fee': 0.0,
        'delivery_address': None,
        'items': [
            {
                'product': product.id,
                'quantity': 1,
                'unit_price': 10.0,
                'subtotal': 10.0
            }
        ]
    }
    
    print(f"Enviando pedido para usuário {user.whatsapp} na loja {store.name}...")
    request = factory.post('/api/orders/', data=json.dumps(payload), content_type='application/json')
    force_authenticate(request, user=user)
    
    try:
        response = view(request)
        print(f"Status: {response.status_code}")
        print(f"Data: {response.data}")
    except Exception as e:
        import traceback
        print(f"Erro ao executar view: {e}")
        traceback.print_exc()

if __name__ == '__main__':
    test()
