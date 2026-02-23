import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import User
from customers.models import Customer
from rest_framework.test import APIRequestFactory, force_authenticate
from accounts.views import UserViewSet
from customers.views import CustomerViewSet

def run_rbac_verification():
    factory = APIRequestFactory()
    
    admin = User.objects.filter(role='ADMIN').first()
    gerente = User.objects.filter(role='GERENTE').first()
    vendedor = User.objects.filter(role='VENDEDOR').first()
    
    if not all([admin, gerente, vendedor]):
        print("Missing required users (ADMIN, GERENTE, VENDEDOR).")
        return

    # Ensure they are in the same store for consistency
    gerente.store = admin.store
    vendedor.store = admin.store
    gerente.save()
    vendedor.save()

    customer = Customer.objects.filter(store=admin.store).first()
    if not customer:
        customer = Customer.objects.create(name="Test Customer", whatsapp="123456789", store=admin.store)
    
    # Ensure Vendedor is the operator so they can 'see' the record for editing test
    customer.operator = vendedor
    customer.save()

    # Ensure Gerente is the operator of Vendedor (so they can see them, but should still be blocked from editing)
    vendedor.operator = gerente
    vendedor.save()

    print(f"Testing with: Admin={admin.whatsapp}, Gerente={gerente.whatsapp}, Vendedor={vendedor.whatsapp}")

    # --- 1. Customer Tests ---
    print("\n--- 1. Customer Tests ---")
    view = CustomerViewSet.as_view({'post': 'create', 'patch': 'partial_update'})
    
    # 1.1 Vendedor can CREATE customer
    Customer.objects.filter(whatsapp='999888777').delete()
    request = factory.post('/api/customers/', {'name': 'New Customer', 'whatsapp': '999888777'}, format='json')
    force_authenticate(request, user=vendedor)
    response = view(request)
    print(f"  Vendedor Create Status: {response.status_code} (Expected 201)")
    if response.status_code != 201:
        print(f"  Create Fail: {response.data}")
    
    # 1.2 Vendedor CANNOT EDIT customer (even if they created it, per "não pode editar")
    new_customer = Customer.objects.filter(whatsapp='999888777').first()
    if new_customer:
        request = factory.patch(f'/api/customers/{new_customer.whatsapp}/', {'name': 'Edited'}, format='json')
        force_authenticate(request, user=vendedor)
        response = view(request, pk=new_customer.whatsapp)
        print(f"  Vendedor Edit Status: {response.status_code} (Expected 403)")

    # 1.3 Gerente CAN EDIT customer they created
    customer.operator = gerente
    customer.save()
    request = factory.patch(f'/api/customers/{customer.whatsapp}/', {'name': 'Gerente Edit'}, format='json')
    force_authenticate(request, user=gerente)
    response = view(request, pk=customer.whatsapp)
    print(f"  Gerente Edit Own Customer: {response.status_code} (Expected 200)")

    # --- 2. Product Tests (Global Visibility & Ownership) ---
    print("\n--- 2. Product Tests ---")
    from products.views import ProductViewSet
    from products.models import Product
    view = ProductViewSet.as_view({'get': 'list', 'post': 'create', 'patch': 'partial_update'})
    
    # Ensure there's a product created by Admin
    prod_admin = Product.objects.filter(name="Admin Product").first()
    if not prod_admin:
        prod_admin = Product.objects.create(name="Admin Product", store=admin.store, operator=admin, price=10.00)
    
    # 2.1 Vendedor can SEE admin product (Global Visibility)
    request = factory.get('/api/products/')
    force_authenticate(request, user=vendedor)
    response = view(request)
    print(f"  Vendedor Sees Admin Product: {any(p['name'] == 'Admin Product' for p in response.data)} (Expected True)")

    # 2.2 Gerente CANNOT EDIT Admin Product
    request = factory.patch(f'/api/products/{prod_admin.id}/', {'name': 'Hacked'}, format='json')
    force_authenticate(request, user=gerente)
    response = view(request, pk=prod_admin.id)
    print(f"  Gerente Edit Admin Product: {response.status_code} (Expected 403)")

    # 2.3 Gerente CAN EDIT their own product
    prod_gerente = Product.objects.filter(name="Gerente Product").first()
    if not prod_gerente:
        prod_gerente = Product.objects.create(name="Gerente Product", store=admin.store, operator=gerente, price=20.00)
    request = factory.patch(f'/api/products/{prod_gerente.id}/', {'name': 'Gerente Edit Success'}, format='json')
    force_authenticate(request, user=gerente)
    response = view(request, pk=prod_gerente.id)
    print(f"  Gerente Edit Own Product: {response.status_code} (Expected 200)")

    # --- 3. User Management Tests ---
    print("\n--- 3. User Management Tests ---")
    view = UserViewSet.as_view({'patch': 'partial_update'})
    
    # Gerente can edit Vendedor they created
    request = factory.patch(f'/api/users/{vendedor.whatsapp}/', {'first_name': 'My Subordinate'}, format='json')
    force_authenticate(request, user=gerente)
    response = view(request, pk=vendedor.whatsapp)
    print(f"  Gerente Edit Subordinate: {response.status_code} (Expected 200)")

if __name__ == '__main__':
    run_rbac_verification()
