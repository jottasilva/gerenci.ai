from stores.views import MultiTenantViewSet
from .models import Supplier
from .serializers import SupplierSerializer
from core.permissions import HasRolePermission


class SupplierViewSet(MultiTenantViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [HasRolePermission]
    required_permissions = {
        'list': 'pdv.vender',
        'retrieve': 'pdv.vender',
        'create': 'pdv.vender',
        'update': 'produto.gerenciar',
        'partial_update': 'produto.gerenciar',
        'destroy': 'produto.gerenciar',
    }
