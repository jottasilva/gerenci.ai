from django.db.models import Sum, Avg, Count, F
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import action
from stores.views import MultiTenantViewSet
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer


class OrderViewSet(MultiTenantViewSet):
    queryset = Order.objects.all().prefetch_related('items')
    serializer_class = OrderSerializer

    def perform_create(self, serializer):
        # Items come from request data — handled in create()
        pass

    def create(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from rest_framework import status
        from django.db import transaction
        from products.models import Product, StockMovement

        data = request.data.copy()
        items_data = data.pop('items', [])

        try:
            with transaction.atomic():
                # Build and validate order (without items)
                serializer = self.get_serializer(data=data)
                serializer.is_valid(raise_exception=True)
                order = serializer.save(store=request.user.store, operator=request.user)

                # Create order items and deduct stock
                for item in items_data:
                    product_id = item.get('product')
                    qty = int(item.get('quantity', 1))
                    
                    # Atomic stock check and deduction
                    product = Product.objects.select_for_update().get(id=product_id, store=request.user.store)
                    if product.stock < qty:
                        raise ValueError(f"Estoque insuficiente para {product.name}. Disponível: {product.stock}")
                    
                    product.stock -= qty
                    product.save()

                    # Create StockMovement for the sale
                    StockMovement.objects.create(
                        store=order.store,
                        product=product,
                        movement_type='SAIDA',
                        quantity=qty,
                        reason=f"Venda - Pedido #{order.id}",
                        operator=request.user
                    )

                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        product_name=product.name,
                        quantity=qty,
                        unit_price=float(item.get('unit_price', product.price)),
                        subtotal=float(item.get('subtotal', qty * product.price)),
                    )

            headers = self.get_success_headers(serializer.data)
            output = OrderSerializer(order, context=self.get_serializer_context())
            return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "Erro ao processar o pedido."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        from rest_framework.response import Response
        from rest_framework import status
        from django.db import transaction
        from products.models import Product, StockMovement

        order = self.get_object()
        
        if order.status == 'CANCELADO':
            return Response({"error": "Pedido já está cancelado."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                order.status = 'CANCELADO'
                order.save()

                # Reverse stock
                items = order.items.all()
                for item in items:
                    if item.product:
                        # Use select_for_update for safety
                        product = Product.objects.select_for_update().get(id=item.product.id)
                        product.stock += item.quantity
                        product.save()

                        # Create StockMovement for the cancellation
                        StockMovement.objects.create(
                            store=order.store,
                            product=product,
                            movement_type='ENTRADA',
                            quantity=item.quantity,
                            reason=f"Estorno - Cancelamento Pedido #{order.id}",
                            operator=request.user
                        )

            return Response({"message": "Pedido cancelado com sucesso e estoque estornado."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Erro ao cancelar pedido: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/orders/stats/
        Returns aggregated dashboard statistics for the selected store.
        """
        store = request.user.store
        if not store:
            return Response({'error': 'Nenhuma loja vinculada.'}, status=400)

        # Base filter: current store, non-cancelled orders
        orders_query = Order.objects.filter(store=store).exclude(status='CANCELADO')
        
        # 1. KPIs
        stats_kpi = orders_query.aggregate(
            total_revenue=Sum('total'),
            avg_ticket=Avg('total'),
            total_orders=Count('id')
        )
        
        from customers.models import Customer
        total_customers = Customer.objects.filter(store=store).count()

        # 2. Sequential Data based on Period
        period = request.query_params.get('period', 'diario')
        now = timezone.now()
        today_date = now.date()

        if period == 'mensal':
            start_date = (today_date - timedelta(days=180)).replace(day=1)
            sales_qs = orders_query.filter(created_at__date__gte=start_date) \
                .annotate(date=TruncMonth('created_at')) \
                .values('date') \
                .annotate(vendas=Sum('total')) \
                .order_by('date')
            
            daily_sales_data = []
            months_br = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
            for i in range(6):
                # Calculate the 6 most recent months
                d = (now - timedelta(days=30*i)).replace(day=1).date()
                res = next((item for item in sales_qs if item['date'].year == d.year and item['date'].month == d.month), None)
                daily_sales_data.insert(0, {
                    'dia': f"{months_br[d.month-1]}/{str(d.year)[2:]}",
                    'vendas': float(res['vendas']) if res else 0.0
                })

        elif period == 'semanal':
            start_date = today_date - timedelta(days=28)
            sales_qs = orders_query.filter(created_at__date__gte=start_date) \
                .annotate(date=TruncWeek('created_at')) \
                .values('date') \
                .annotate(vendas=Sum('total')) \
                .order_by('date')
            
            daily_sales_data = []
            for i in range(4):
                d = today_date - timedelta(days=7*i)
                # Get start of week
                d_start = d - timedelta(days=d.weekday())
                res = next((item for item in sales_qs if item['date'] == d_start), None)
                daily_sales_data.insert(0, {
                    'dia': f"Sem {d_start.day}/{d_start.month}",
                    'vendas': float(res['vendas']) if res else 0.0
                })
        else: # diario (7 days)
            start_date = today_date - timedelta(days=6)
            sales_qs = orders_query.filter(created_at__date__gte=start_date) \
                .annotate(date=TruncDate('created_at')) \
                .values('date') \
                .annotate(vendas=Sum('total')) \
                .order_by('date')
            
            weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
            daily_sales_data = []
            for i in range(7):
                d = start_date + timedelta(days=i)
                res = next((item for item in sales_qs if item['date'] == d), None)
                daily_sales_data.append({
                    'dia': weekdays[d.weekday()],
                    'vendas': float(res['vendas']) if res else 0.0
                })

        # 3. Sales by Category
        from products.models import Product
        category_sales = OrderItem.objects.filter(order__store=store).exclude(order__status='CANCELADO') \
            .values(cat_name=F('product__category__name')) \
            .annotate(value=Sum('subtotal')) \
            .order_by('-value')
        
        category_data = []
        for item in category_sales:
            category_data.append({
                'name': item['cat_name'] or 'Sem categoria',
                'value': float(item['value'])
            })

        # 4. Top Products
        top_products = OrderItem.objects.filter(order__store=store).exclude(order__status='CANCELADO') \
            .values('product', name=F('product__name')) \
            .annotate(total=Sum('subtotal')) \
            .order_by('-total')[:5]

        top_products_data = []
        for item in top_products:
            top_products_data.append({
                'id': str(item['product']),
                'nome': item['name'],
                'total': float(item['total'])
            })

        # 5. Today's KPIs
        now_local = timezone.localtime(timezone.now())
        today = now_local.date()
        today_orders = orders_query.filter(created_at__date=today)
        today_kpi = today_orders.aggregate(
            revenue=Sum('total'),
            count=Count('id'),
            avg=Avg('total')
        )

        return Response({
            'kpis': {
                'total_revenue': float(stats_kpi['total_revenue'] or 0.0),
                'avg_ticket': float(stats_kpi['avg_ticket'] or 0.0),
                'total_orders': stats_kpi['total_orders'],
                'total_customers': total_customers
            },
            'today': {
                'revenue': float(today_kpi['revenue'] or 0.0),
                'orders': today_kpi['count'],
                'avg_ticket': float(today_kpi['avg'] or 0.0)
            },
            'daily_sales': daily_sales_data,
            'category_sales': category_data,
            'top_products': top_products_data
        })
