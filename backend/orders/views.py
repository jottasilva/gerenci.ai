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
