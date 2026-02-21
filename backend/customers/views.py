from stores.views import MultiTenantViewSet
from .models import Customer
from .serializers import CustomerSerializer

class CustomerViewSet(MultiTenantViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
