from django.db.models import Sum, Avg, Count, F, ExpressionWrapper, DecimalField
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth, ExtractHour
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from stores.views import MultiTenantViewSet
from .models import Order, OrderItem, DiscountCoupon
from .serializers import OrderSerializer, OrderItemSerializer, DiscountCouponSerializer
from core.permissions import HasRolePermission, check_permission
from core.audit import log_critical_action
from stores.service_hours import is_within_service_hours


class DiscountCouponViewSet(MultiTenantViewSet):
    queryset = DiscountCoupon.objects.all()
    serializer_class = DiscountCouponSerializer
    permission_classes = [HasRolePermission]
    required_permissions = {
        'list': 'pdv.vender',
        'retrieve': 'pdv.vender',
        'create': 'produto.gerenciar',
        'update': 'produto.gerenciar',
        'partial_update': 'produto.gerenciar',
        'destroy': 'produto.gerenciar',
        'validate': 'pdv.vender',
    }

    @action(detail=False, methods=['post'])
    def validate(self, request):
        """Validate a coupon code and return its details if valid."""
        code = request.data.get('code', '').strip().upper()
        if not code:
            return Response({'valid': False, 'error': 'Código não informado.'}, status=400)

        store = self._get_effective_store()
        try:
            coupon = DiscountCoupon.objects.get(store=store, code=code)
        except DiscountCoupon.DoesNotExist:
            return Response({'valid': False, 'error': 'Cupom não encontrado.'}, status=404)

        if not coupon.is_valid:
            return Response({'valid': False, 'error': 'Cupom expirado ou esgotado.'}, status=400)

        return Response({
            'valid': True,
            'id': coupon.id,
            'code': coupon.code,
            'percentage': float(coupon.percentage),
        })


class OrderViewSet(MultiTenantViewSet):
    queryset = Order.objects.all().prefetch_related('items')
    serializer_class = OrderSerializer
    permission_classes = [HasRolePermission]
    required_permissions = {
        'list': 'pdv.vender',
        'retrieve': 'pdv.vender',
        'create': 'pdv.vender',
        'update': 'pdv.cancelar',
        'partial_update': 'pdv.cancelar',
        'cancel': 'pdv.cancelar',
        'stats': 'relatorio.vendas',
    }

    def perform_create(self, serializer):
        # Items come from request data — handled in create()
        pass

    def create(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from rest_framework import status
        from django.db import transaction
        from products.models import Product, StockMovement

        try:
            store = self._get_effective_store()
            if not store:
                return Response({'error': 'Nenhuma loja vinculada.'}, status=400)

            # 1. Service Hours Validation
            allowed, msg = is_within_service_hours(store.id, user=request.user)
            if not allowed:
                log_critical_action(request.user, 'pdv.tentativa_fora_horario', reason=msg)
                return Response({'error': msg}, status=status.HTTP_403_FORBIDDEN)

            data = request.data.copy()
            items_data = data.pop('items', [])

            with transaction.atomic():
                # Build and validate order (without items)
                serializer = self.get_serializer(data=data)
                serializer.is_valid(raise_exception=True)
                order = serializer.save(store=store, operator=request.user)

                # Create order items and deduct stock
                for item in items_data:
                    product_id = item.get('product')
                    if not product_id:
                        continue

                    qty = int(item.get('quantity', 1))
                    
                    try:
                        product = Product.objects.select_for_update().get(id=product_id, store=store)
                    except Product.DoesNotExist:
                        raise ValueError(f"Produto #{product_id} não encontrado na loja selecionada.")

                    if product.stock < qty:
                        raise ValueError(f"Estoque insuficiente para {product.name}. Disponível: {product.stock}")
                    
                    product.stock -= qty
                    product.save()

                    StockMovement.objects.create(
                        store=store,
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
                        unit_price=float(item.get('unit_price') or product.price or 0.0),
                        subtotal=float(item.get('subtotal') or (qty * (product.price or 0.0))),
                    )

            # 2. Audit the successful order
            log_critical_action(
                request.user, 
                'pdv.vender', 
                target_object=order, 
                payload={'total': float(order.total), 'items_count': len(items_data)}
            )

            headers = self.get_success_headers(serializer.data)
            output = OrderSerializer(order, context=self.get_serializer_context())
            return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            from django.utils import timezone
            error_msg = f"DEBUG: Order create failed: {str(e)}\n{traceback.format_exc()}"
            print(error_msg)
            try:
                with open('backend_error.log', 'a', encoding='utf-8') as f:
                    f.write(f"\n--- {timezone.now()} ---\n{error_msg}\n")
            except:
                pass
            from rest_framework.exceptions import ValidationError
            if isinstance(e, ValidationError):
                return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": f"Erro interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
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

                # Audit the cancellation
                log_critical_action(
                    request.user, 
                    'pdv.cancelar', 
                    target_object=order, 
                    reason=request.data.get('reason', 'Cancelamento pelo operador')
                )

            return Response({"message": "Pedido cancelado com sucesso e estoque estornado."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Erro ao cancelar pedido: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/orders/stats/
        Returns aggregated dashboard statistics for the selected store.
        All data is filtered according to the selected period.
        """
        store = self._get_effective_store()
        if not store:
            return Response({'error': 'Nenhuma loja vinculada.'}, status=400)

        # Base filter: current store, non-cancelled orders
        base_query = Order.objects.filter(store=store).exclude(status='CANCELADO')

        # Determine period and date range
        period = request.query_params.get('period', 'diario')
        now = timezone.localtime(timezone.now())
        today_date = now.date()

        if period == 'mensal':
            period_start = today_date - timedelta(days=30)  # Últimos 30 dias
        elif period == 'semanal':
            period_start = today_date - timedelta(days=7)   # Últimos 7 dias
        else:  # diario
            period_start = today_date  # Somente hoje

        # Period-filtered query for KPIs, category, top products
        period_query = base_query.filter(created_at__date__gte=period_start)

        # 1. KPIs (filtered by period)
        stats_kpi = period_query.aggregate(
            total_revenue=Sum('total'),
            avg_ticket=Avg('total'),
            total_orders=Count('id')
        )

        from customers.models import Customer
        total_customers = Customer.objects.filter(store=store).count()

        # 2. Sequential Data based on Period (for chart)
        if period == 'mensal':
            chart_start = (today_date - timedelta(days=180)).replace(day=1)
            sales_qs = base_query.filter(created_at__date__gte=chart_start) \
                .annotate(date=TruncMonth('created_at')) \
                .values('date') \
                .annotate(vendas=Sum('total')) \
                .order_by('date')

            daily_sales_data = []
            months_br = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
            curr_d = today_date.replace(day=1)
            for i in range(6):
                d = curr_d
                res = next((item for item in sales_qs if (item['date'].date() if hasattr(item['date'], 'date') else item['date']) == d), None)
                daily_sales_data.insert(0, {
                    'dia': f"{months_br[d.month-1]}/{str(d.year)[2:]}",
                    'vendas': float(res['vendas']) if res else 0.0
                })
                # Retroceder um mês corretamente
                prev_month = d - timedelta(days=1)
                curr_d = prev_month.replace(day=1)

        elif period == 'semanal':
            chart_start = today_date - timedelta(days=28)
            sales_qs = base_query.filter(created_at__date__gte=chart_start) \
                .annotate(date=TruncWeek('created_at')) \
                .values('date') \
                .annotate(vendas=Sum('total')) \
                .order_by('date')

            daily_sales_data = []
            for i in range(4):
                d = today_date - timedelta(days=7*i)
                d_start = d - timedelta(days=d.weekday())
                res = next((item for item in sales_qs if (item['date'].date() if hasattr(item['date'], 'date') else item['date']) == d_start), None)
                daily_sales_data.insert(0, {
                    'dia': f"Sem {d_start.day}/{d_start.month}",
                    'vendas': float(res['vendas']) if res else 0.0
                })
        else:  # diario (7 days)
            chart_start = today_date - timedelta(days=6)
            sales_qs = base_query.filter(created_at__date__gte=chart_start) \
                .annotate(date=TruncDate('created_at')) \
                .values('date') \
                .annotate(vendas=Sum('total')) \
                .order_by('date')

            weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
            daily_sales_data = []
            for i in range(7):
                d = chart_start + timedelta(days=i)
                res = next((item for item in sales_qs if (item['date'].date() if hasattr(item['date'], 'date') else item['date']) == d), None)
                daily_sales_data.append({
                    'dia': weekdays[d.weekday()],
                    'vendas': float(res['vendas']) if res else 0.0
                })

        # 3. Sales by Category (filtered by period)
        category_sales = OrderItem.objects.filter(
            order__store=store,
            order__created_at__date__gte=period_start
        ).exclude(order__status='CANCELADO') \
            .values(cat_name=F('product__category__name')) \
            .annotate(value=Sum('subtotal')) \
            .order_by('-value')

        category_data = []
        for item in category_sales:
            category_data.append({
                'name': item['cat_name'] or 'Sem categoria',
                'value': float(item['value'])
            })

        # 4. Top Products (filtered by period)
        top_products = OrderItem.objects.filter(
            order__store=store,
            order__created_at__date__gte=period_start
        ).exclude(order__status='CANCELADO') \
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

        # 5. Period KPIs (main cards)
        # Include Profit calculation
        # Profit = Sum(item.subtotal - (item.product.cost_price * item.quantity))
        profit_qs = OrderItem.objects.filter(
            order__store=store,
            order__created_at__date__gte=period_start
        ).exclude(order__status='CANCELADO').annotate(
            item_profit=ExpressionWrapper(
                F('subtotal') - (F('product__cost_price') * F('quantity')),
                output_field=DecimalField()
            )
        ).aggregate(total_profit=Sum('item_profit'))

        period_kpi = period_query.aggregate(
            revenue=Sum('total'),
            count=Count('id'),
            avg=Avg('total')
        )

        # 6. Peak Hours (Filtered by base_query to show patterns)
        peak_hours_qs = period_query.annotate(hour=ExtractHour('created_at')) \
            .values('hour') \
            .annotate(count=Count('id')) \
            .order_by('hour')
        
        peak_hours_data = {str(i): 0 for i in range(24)}
        for item in peak_hours_qs:
            peak_hours_data[str(item['hour'])] = item['count']

        # 7. Payment Methods
        payment_methods = period_query.values('payment_method') \
            .annotate(value=Sum('total'), count=Count('id')) \
            .order_by('-value')

        payment_data = []
        for item in payment_methods:
            payment_data.append({
                'name': item['payment_method'],
                'value': float(item['value'] or 0.0),
                'count': item['count']
            })

        # 8. Inventory Value (Total Assets)
        from products.models import Product
        inventory_stats = Product.objects.filter(store=store, is_active=True).aggregate(
            total_value=Sum(F('stock') * F('cost_price')),
            total_items=Sum('stock')
        )

        # Period label for frontend
        period_labels = {
            'diario': 'Hoje',
            'semanal': 'Últimos 7 dias',
            'mensal': 'Últimos 30 dias'
        }

        return Response({
            'period': period,
            'period_label': period_labels.get(period, 'Hoje'),
            'kpis': {
                'total_revenue': float(stats_kpi['total_revenue'] or 0.0),
                'avg_ticket': float(stats_kpi['avg_ticket'] or 0.0),
                'total_orders': stats_kpi['total_orders'],
                'total_customers': total_customers,
                'inventory_value': float(inventory_stats['total_value'] or 0.0),
                'inventory_items': inventory_stats['total_items'] or 0
            },
            'period_kpis': {
                'revenue': float(period_kpi['revenue'] or 0.0),
                'profit': float(profit_qs['total_profit'] or 0.0),
                'orders': period_kpi['count'],
                'avg_ticket': float(period_kpi['avg'] or 0.0)
            },
            'daily_sales': daily_sales_data,
            'category_sales': category_data,
            'top_products': top_products_data,
            'payment_methods': payment_data,
            'peak_hours': peak_hours_data
        })
