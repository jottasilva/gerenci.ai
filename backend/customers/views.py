from stores.views import MultiTenantViewSet
from core.permissions import HasRolePermission
from .models import Customer
from .serializers import CustomerSerializer

class CustomerViewSet(MultiTenantViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [HasRolePermission]
    required_permissions = {
        'list': 'pdv.vender',
        'retrieve': 'pdv.vender',
        'create': 'pdv.vender', # Allow seller to create
        'update': 'relatorio.vendas', # Editing requires Manager+
        'partial_update': 'relatorio.vendas',
        'destroy': 'usuario.gerenciar', # Deleting requires Admin
    }
