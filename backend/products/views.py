from stores.views import MultiTenantViewSet
from .models import Product, Category, StockMovement
from .serializers import ProductSerializer, CategorySerializer, StockMovementSerializer
from rest_framework.response import Response
from rest_framework import status


class CategoryViewSet(MultiTenantViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductViewSet(MultiTenantViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def create(self, request, *args, **kwargs):
        # Feature gate: check product limit before creating
        from billing.permissions import check_feature, SubscriptionLimitExceeded
        store = request.user.store
        try:
            check_feature(store, 'create_product')
        except SubscriptionLimitExceeded as e:
            return Response(
                {'detail': e.detail, 'code': e.reason},
                status=status.HTTP_402_PAYMENT_REQUIRED
            )
        return super().create(request, *args, **kwargs)


class StockMovementViewSet(MultiTenantViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
