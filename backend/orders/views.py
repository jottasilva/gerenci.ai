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

        data = request.data.copy()
        items_data = data.pop('items', [])

        # Build and validate order (without items)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(store=request.user.store, operator=request.user)

        # Create order items
        for item in items_data:
            OrderItem.objects.create(
                order=order,
                product_id=item.get('product'),
                product_name=item.get('product_name', ''),
                quantity=int(item.get('quantity', 1)),
                unit_price=float(item.get('unit_price', 0)),
                subtotal=float(item.get('subtotal', 0)),
            )

        headers = self.get_success_headers(serializer.data)
        output = OrderSerializer(order, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)
