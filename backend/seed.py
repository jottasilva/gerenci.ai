import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from stores.models import Store
from accounts.models import User
from products.models import Product, Category, StockMovement
from customers.models import Customer
from orders.models import Order, OrderItem
from billing.models import SubscriptionPlan, Subscription, UsageTracking
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
import random

def seed_plans():
    """Seed the 3 subscription plans."""
    plans_data = [
        {
            'name': 'Basico',
            'slug': 'basico',
            'price': Decimal('97.00'),
            'description': 'Ideal para pequenos negocios que estao comecando.',
            'is_highlighted': False,
            'limits': {
                'max_products': 500,
                'max_operators': 2,
                'max_whatsapp': 1,
                'advanced_reports': False,
                'api_access': False,
                'multi_store': False,
                'priority_support': False,
                'dedicated_support': False,
                'sla': False,
            },
            'features': [
                '1 numero WhatsApp',
                'Ate 500 produtos',
                '2 operadores',
                'Relatorios basicos',
                'Suporte por email',
            ],
        },
        {
            'name': 'Pro',
            'slug': 'pro',
            'price': Decimal('127.00'),
            'description': 'Para negocios em crescimento que precisam de mais poder.',
            'is_highlighted': True,
            'limits': {
                'max_products': -1,
                'max_operators': 10,
                'max_whatsapp': 3,
                'advanced_reports': True,
                'api_access': False,
                'multi_store': False,
                'priority_support': True,
                'dedicated_support': False,
                'sla': False,
            },
            'features': [
                '3 numeros WhatsApp',
                'Produtos ilimitados',
                '10 operadores',
                'Relatorios avancados',
                'Suporte prioritario',
            ],
        },
        {
            'name': 'Enterprise',
            'slug': 'enterprise',
            'price': Decimal('297.00'),
            'description': 'Solucao completa para grandes operacoes multi-loja.',
            'is_highlighted': False,
            'limits': {
                'max_products': -1,
                'max_operators': -1,
                'max_whatsapp': -1,
                'advanced_reports': True,
                'api_access': True,
                'multi_store': True,
                'priority_support': True,
                'dedicated_support': True,
                'sla': True,
            },
            'features': [
                'Numeros ilimitados',
                'Multi-loja',
                'API completa',
                'Suporte dedicado',
                'SLA garantido',
            ],
        },
    ]

    created_plans = {}
    for data in plans_data:
        plan, _ = SubscriptionPlan.objects.update_or_create(
            slug=data['slug'],
            defaults=data
        )
        created_plans[data['slug']] = plan
    print("Planos de assinatura criados.")
    return created_plans


def seed():
    print("Iniciando seed completo...")

    # ─── 0. Seed Plans ───────────────────────────────────────
    plans = seed_plans()

    # ─── 1. Store ────────────────────────────────────────────
    store, _ = Store.objects.get_or_create(
        whatsapp='43991359790',
        defaults={'name': 'Gerenc.AI', 'address': 'Londrina - PR', 'is_active': True}
    )
    print(f"Loja: {store.name}")

    # ─── 1b. Subscription for seeded store ───────────────────
    pro_plan = plans.get('pro')
    if pro_plan:
        sub, _ = Subscription.objects.get_or_create(
            store=store,
            defaults={
                'plan': pro_plan,
                'status': 'active',
                'start_date': timezone.now(),
                'end_date': timezone.now() + timedelta(days=30),
            }
        )
        UsageTracking.objects.get_or_create(store=store)
    print("Assinatura Pro ativada para loja.")

    # ─── 2. Admin User (user already created via CLI) ────────
    admin, created = User.objects.get_or_create(
        whatsapp='43991359790',
        defaults={
            'first_name': 'Admin',
            'last_name': 'Master',
            'role': 'ADMIN',
            'store': store,
            'is_staff': True,
            'is_superuser': True,
            'ativo': True,
        }
    )
    if created:
        admin.set_password('123456')
        admin.save()
    else:
        # Ensure existing user is linked to this store
        admin.store = store
        admin.save(update_fields=['store'])
    print(f"Admin: {admin.whatsapp}")

    # ─── 3. Extra Operators ──────────────────────────────────
    operators = [
        {'name': 'Carlos Vendedor', 'whatsapp': '43991110001', 'role': 'VENDEDOR', 'pwd': '123456'},
        {'name': 'Ana Gerente',     'whatsapp': '43991110002', 'role': 'GERENTE',  'pwd': '123456'},
    ]
    for op in operators:
        u, created = User.objects.get_or_create(
            whatsapp=op['whatsapp'],
            defaults={'first_name': op['name'].split()[0], 'last_name': op['name'].split()[-1],
                      'role': op['role'], 'store': store, 'ativo': True}
        )
        if created:
            u.set_password(op['pwd'])
            u.save()
    print("Operadores criados.")

    # ─── 4. Categories ───────────────────────────────────────
    cat_names = ['Bebidas', 'Snacks', 'Doces', 'Café', 'Alimentos', 'Higiene']
    cats = {}
    for name in cat_names:
        cat, _ = Category.objects.get_or_create(store=store, name=name, defaults={'operator': admin})
        cats[name] = cat
    print("Categorias criadas.")

    # ─── 5. Products ─────────────────────────────────────────
    products_data = [
        {'name': 'Coca-Cola 350ml',       'price': 5.00,  'stock': 48, 'min': 10, 'cat': 'Bebidas',   'sku': 'COCA350'},
        {'name': 'Coca-Cola 600ml',       'price': 7.50,  'stock': 32, 'min': 8,  'cat': 'Bebidas',   'sku': 'COCA600'},
        {'name': 'Cerveja Lata 350ml',    'price': 4.50,  'stock': 3,  'min': 10, 'cat': 'Bebidas',   'sku': 'CERV350'},
        {'name': 'Água Mineral 500ml',    'price': 2.50,  'stock': 72, 'min': 15, 'cat': 'Bebidas',   'sku': 'AGUA500'},
        {'name': 'Suco de Laranja 300ml', 'price': 6.00,  'stock': 20, 'min': 8,  'cat': 'Bebidas',   'sku': 'SUCO300'},
        {'name': 'Energético Monster',    'price': 11.00, 'stock': 18, 'min': 5,  'cat': 'Bebidas',   'sku': 'MON001'},
        {'name': 'Salgadinho Doritos',    'price': 7.00,  'stock': 0,  'min': 5,  'cat': 'Snacks',    'sku': 'DOR001'},
        {'name': 'Pringles Original',     'price': 12.00, 'stock': 15, 'min': 5,  'cat': 'Snacks',    'sku': 'PRING001'},
        {'name': 'Amendoim Crocante',     'price': 4.00,  'stock': 40, 'min': 10, 'cat': 'Snacks',    'sku': 'AMEND001'},
        {'name': 'Chocolate Bis',         'price': 3.00,  'stock': 30, 'min': 10, 'cat': 'Doces',     'sku': 'BIS001'},
        {'name': 'Kit Kat 45g',           'price': 6.50,  'stock': 25, 'min': 8,  'cat': 'Doces',     'sku': 'KIT001'},
        {'name': 'Bala Halls Menta',      'price': 2.00,  'stock': 60, 'min': 20, 'cat': 'Doces',     'sku': 'HALLS001'},
        {'name': 'Café Espresso 50ml',    'price': 4.00,  'stock': 0,  'min': 10, 'cat': 'Café',      'sku': 'ESP001'},
        {'name': 'Cappuccino 200ml',      'price': 8.00,  'stock': 10, 'min': 5,  'cat': 'Café',      'sku': 'CAP001'},
        {'name': 'Pão de Queijo (un)',    'price': 3.50,  'stock': 50, 'min': 20, 'cat': 'Alimentos', 'sku': 'PDQ001'},
        {'name': 'Sanduíche Natural',     'price': 14.00, 'stock': 8,  'min': 5,  'cat': 'Alimentos', 'sku': 'SAN001'},
        {'name': 'Sabonete Dove 90g',     'price': 5.50,  'stock': 22, 'min': 5,  'cat': 'Higiene',   'sku': 'SAB001'},
    ]
    prod_objs = {}
    for p in products_data:
        obj, _ = Product.objects.get_or_create(
            store=store,
            sku=p['sku'],
            defaults={
                'name': p['name'],
                'price': Decimal(str(p['price'])),
                'stock': p['stock'],
                'min_stock': p['min'],
                'category': cats[p['cat']],
                'is_active': True,
                'operator': admin,
            }
        )
        prod_objs[p['sku']] = obj
    print(f"{len(prod_objs)} produtos criados.")

    # ─── 6. Customers ────────────────────────────────────────
    customers_data = [
        {'name': 'João Silva',     'whatsapp': '43999001001', 'email': 'joao@email.com',  'address': 'Rua das Flores, 123'},
        {'name': 'Maria Santos',   'whatsapp': '43999002002', 'email': 'maria@email.com', 'address': 'Av. Brasil, 456'},
        {'name': 'Pedro Alves',    'whatsapp': '43999003003', 'email': None,               'address': None},
        {'name': 'Ana Costa',      'whatsapp': '43999004004', 'email': 'ana@email.com',   'address': 'Rua 7 de Setembro, 789'},
        {'name': 'Rafael Souza',   'whatsapp': '43999005005', 'email': None,               'address': None},
        {'name': 'Juliana Ferraz', 'whatsapp': '43999006006', 'email': None,               'address': 'Alameda Santos, 1200'},
        {'name': 'Lucas Martins',  'whatsapp': '43999007007', 'email': None,               'address': None},
        {'name': 'Fernanda Lima',  'whatsapp': '43999008008', 'email': 'fe@email.com',    'address': 'Rua XV, 55'},
    ]
    cust_objs = []
    for c in customers_data:
        obj, _ = Customer.objects.get_or_create(
            store=store,
            whatsapp=c['whatsapp'],
            defaults={'name': c['name'], 'email': c['email'], 'address': c['address'], 'operator': admin}
        )
        cust_objs.append(obj)
    print(f"{len(cust_objs)} clientes criados.")

    # ─── 7. Orders ───────────────────────────────────────────
    orders_data = [
        {
            'customer': cust_objs[0], 'status': 'ENTREGUE', 'payment': 'PIX',
            'items': [('COCA350', 3), ('BIS001', 2)]
        },
        {
            'customer': cust_objs[1], 'status': 'ENTREGUE', 'payment': 'DINHEIRO',
            'items': [('PRING001', 1), ('MON001', 2), ('AGUA500', 2)]
        },
        {
            'customer': cust_objs[2], 'status': 'CONFIRMADO', 'payment': 'CARTAO_CREDITO',
            'items': [('COCA600', 2), ('SAN001', 1)]
        },
        {
            'customer': cust_objs[3], 'status': 'EM_PREPARO', 'payment': 'PIX',
            'items': [('CAP001', 2), ('PDQ001', 4)]
        },
        {
            'customer': None, 'customer_name': 'Balcão', 'status': 'ENTREGUE', 'payment': 'DINHEIRO',
            'items': [('CERV350', 4), ('AMEND001', 2)]
        },
        {
            'customer': cust_objs[4], 'status': 'ENTREGUE', 'payment': 'PIX',
            'items': [('KIT001', 1), ('SUCO300', 2), ('HALLS001', 3)]
        },
        {
            'customer': cust_objs[5], 'status': 'ABERTO', 'payment': 'PIX',
            'items': [('COCA350', 6), ('DOR001', 0)]
        },
        {
            'customer': cust_objs[6], 'status': 'CANCELADO', 'payment': 'DINHEIRO',
            'items': [('SAB001', 2)]
        },
    ]

    order_count = 0
    for od in orders_data:
        items_valid = [(sku, qty) for sku, qty in od['items'] if qty > 0 and sku in prod_objs]
        if not items_valid:
            continue
        total = sum(prod_objs[sku].price * qty for sku, qty in items_valid)
        order = Order.objects.create(
            store=store,
            customer=od.get('customer'),
            customer_name_manual=od.get('customer_name'),
            total=total,
            discount=Decimal('0'),
            payment_method=od['payment'],
            status=od['status'],
            operator=admin,
        )
        for sku, qty in items_valid:
            prod = prod_objs[sku]
            OrderItem.objects.create(
                order=order,
                product=prod,
                product_name=prod.name,
                quantity=qty,
                unit_price=prod.price,
                subtotal=prod.price * qty,
            )
        order_count += 1
    print(f"{order_count} pedidos criados.")

    # ─── 8. Stock Movements ──────────────────────────────────
    movements = [
        ('COCA350', 'ENTRADA', 50, 'Reposição semanal'),
        ('CERV350', 'SAIDA',    5, 'Venda balcão'),
        ('DOR001',  'AJUSTE',  -7, 'Inventário — produto vencido'),
        ('ESP001',  'ENTRADA', 20, 'Compra fornecedor'),
        ('CAP001',  'SAIDA',    4, 'Venda do dia'),
    ]
    for sku, mtype, qty, reason in movements:
        if sku in prod_objs:
            StockMovement.objects.get_or_create(
                store=store,
                product=prod_objs[sku],
                movement_type=mtype,
                quantity=abs(qty),
                reason=reason,
                defaults={'operator': admin}
            )
    print("Movimentos de estoque criados.")

    print("\nSeed finalizado com sucesso!")
    print(f"   Loja:       {store.name}")
    print(f"   Login:      43991359790 / 123456")

if __name__ == '__main__':
    seed()
