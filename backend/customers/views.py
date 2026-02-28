from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from stores.views import MultiTenantViewSet
from core.permissions import HasRolePermission
from core.audit import log_data_access
from .models import Customer
from .serializers import CustomerSerializer

class CustomerViewSet(MultiTenantViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [HasRolePermission]
    required_permissions = {
        'list': 'pdv.vender',
        'retrieve': 'pdv.vender',
        'create': 'pdv.vender',
        'update': 'relatorio.vendas',
        'partial_update': 'relatorio.vendas',
        'destroy': 'usuario.gerenciar',
    }

    def list(self, request, *args, **kwargs):
        log_data_access(request, 'LIST', 'customer')
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        log_data_access(request, 'VIEW', 'customer', instance.pk)
        return super().retrieve(request, *args, **kwargs)

    def perform_create(self, serializer):
        # MultiTenantViewSet handles store/operator assignment
        super().perform_create(serializer)
        instance = serializer.instance
        log_data_access(self.request, 'EDIT', 'customer', instance.pk, {'action': 'CREATE'})

    def perform_update(self, serializer):
        # Just ensure data access is logged correctly after save
        super().perform_update(serializer)
        instance = serializer.instance
        log_data_access(self.request, 'EDIT', 'customer', instance.pk, {'action': 'UPDATE'})

    def perform_destroy(self, instance):
        customer_id = instance.pk
        instance.delete()
        log_data_access(self.request, 'DELETE', 'customer', customer_id)

    @action(detail=True, methods=['get'], url_path='export-data')
    def export_data(self, request, pk=None):
        """Art. 18, V — Portabilidade de dados."""
        customer = self.get_object()
        from orders.models import Order
        orders = Order.objects.filter(customer=customer).values(
            'id', 'total', 'payment_method', 'status', 'created_at'
        )
        data = {
            'dados_pessoais': {
                'nome': customer.name,
                'whatsapp': customer.whatsapp,
                'email': customer.email,
                'endereco': customer.address,
                'cpf_cnpj': customer.cpf_cnpj,
            },
            'historico_compras': list(orders),
            'exportado_em': timezone.now().isoformat(),
        }
        log_data_access(request, 'EXPORT', 'customer', customer.pk)
        return Response(data)

    @action(detail=True, methods=['post'], url_path='request-deletion')
    def request_deletion(self, request, pk=None):
        """Art. 18, VI — Eliminação dos dados (Anonimização)."""
        customer = self.get_object()
        # Anonimizar dados sensíveis
        customer.name = f"Cliente Anonimizado {customer.pk[:4]}"
        customer.email = None
        customer.address = None
        customer.cpf_cnpj = None
        customer.is_active = False
        customer.save()
        
        log_data_access(request, 'DELETE', 'customer', customer.pk, {'method': 'ANONYMIZE'})
        return Response({'message': 'Dados pessoais removidos/anonimizados com sucesso.'})

