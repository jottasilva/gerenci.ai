from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser
from stores.views import MultiTenantViewSet
from .models import Product, Category, StockMovement
from .serializers import ProductSerializer, CategorySerializer, StockMovementSerializer
from core.permissions import HasRolePermission
from core.audit import log_critical_action


class CategoryViewSet(MultiTenantViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [HasRolePermission]
    required_permissions = {
        'list': 'pdv.vender',
        'retrieve': 'pdv.vender',
        'create': 'pdv.vender', # Allow seller to create
        'update': 'categoria.gerenciar',
        'partial_update': 'categoria.gerenciar',
        'destroy': 'categoria.gerenciar',
    }


class ProductViewSet(MultiTenantViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    parser_classes = (MultiPartParser, JSONParser)
    permission_classes = [HasRolePermission]
    required_permissions = {
        'list': 'pdv.vender',
        'retrieve': 'pdv.vender',
        'create': 'pdv.vender', # Allow seller to create
        'update': 'produto.gerenciar',
        'partial_update': 'produto.gerenciar',
        'destroy': 'produto.gerenciar',
    }

    def create(self, request, *args, **kwargs):
        # Feature gate: check product limit before creating
        from billing.permissions import check_feature, SubscriptionLimitExceeded
        store = self._get_effective_store()
        if not store:
             return Response({'error': 'Nenhuma loja vinculada.'}, status=400)
             
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
    permission_classes = [HasRolePermission]
    required_permissions = {
        'list': 'relatorio.vendas', # Allow view stock history
        'retrieve': 'relatorio.vendas',
        'create': 'estoque.ajustar',
        'update': 'estoque.ajustar',
        'partial_update': 'estoque.ajustar',
        'destroy': 'estoque.ajustar',
    }

    def perform_create(self, serializer):
        movement = serializer.save(store=self._get_effective_store(), operator=self.request.user)
        
        # Audit critical adjustments
        if movement.movement_type == 'AJUSTE':
            log_critical_action(
                self.request.user,
                'estoque.ajustar',
                target_object=movement.product,
                reason=movement.reason,
                payload={'qty': movement.quantity, 'type': 'AJUSTE'}
            )
