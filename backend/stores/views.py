from rest_framework import viewsets, permissions, generics, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.response import Response
from .models import Store
from .serializers import StoreSerializer
from .service_hours import get_store_service_hours, save_store_service_hours
from core.permissions import HasRolePermission
from core.audit import log_critical_action


class MultiTenantViewSet(viewsets.ModelViewSet):
    def _get_effective_store(self):
        """Returns the store to use for filtering. Admins can override via X-Store-ID header."""
        user = self.request.user
        store_id = self.request.headers.get('X-Store-ID')
        if store_id and (user.is_staff or getattr(user, 'role', None) == 'ADMIN'):
            try:
                return Store.objects.get(id=store_id)
            except Store.DoesNotExist:
                pass
        return user.store

    def get_queryset(self):
        user = self.request.user
        
        # 1. Base Queryset
        queryset = getattr(self, 'queryset', None)
        if queryset is None:
            model = getattr(self, 'model', None)
            if not model and hasattr(self, 'get_serializer_class'):
                model = self.get_serializer_class().Meta.model
            if model:
                queryset = model.objects.all()
            else:
                return []

        if not user.is_authenticated:
            return queryset.none() if hasattr(queryset, 'none') else []
        
        store = self._get_effective_store()
        if not store:
            return queryset.none() if hasattr(queryset, 'none') else []

        # 2. Base filter by store
        qs = queryset.filter(store=store)

        # 3. Strict isolation for Non-Admins
        if not (user.is_staff or getattr(user, 'role', None) == 'ADMIN'):
            model = queryset.model
            model_fields = [f.name for f in model._meta.get_fields()]
            
            # Global visibility for Products and Categories within the store
            from products.models import Product, Category
            if model in [Product, Category]:
                return qs # Everyone in the store can see all products/categories
            
            # Ownership filtering for everything else (Orders, Customers, etc)
            if 'operator' in model_fields:
                if model == user.__class__:
                    from django.db.models import Q
                    qs = qs.filter(Q(operator=user) | Q(whatsapp=user.whatsapp))
                else:
                    qs = qs.filter(operator=user)
            
        return qs

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        
        # Ownership Rule: Non-Admins can only EDIT/DELETE what they created
        if not (request.user.role == 'ADMIN' or request.user.is_staff):
            if request.method in ['PUT', 'PATCH', 'DELETE']:
                # If the object has an operator and it's not the user, block editing
                operator = getattr(obj, 'operator', None)
                if operator and operator.whatsapp != request.user.whatsapp:
                    # Special case for User model: allow self-edit (handled already by whatsapp check in queryset or elsewhere, 
                    # but let's be explicit here if it's not the owner)
                    self.permission_denied(
                        request, 
                        message="Você só tem permissão para alterar registros criados por você."
                    )

    def perform_create(self, serializer):
        store = self._get_effective_store()
        # Automatically set the operator as the current user if the field exists
        kwargs = {'store': store}
        if hasattr(serializer.Meta.model, 'operator') or 'operator' in [f.name for f in serializer.Meta.model._meta.get_fields()]:
            kwargs['operator'] = self.request.user
        serializer.save(**kwargs)


class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [HasRolePermission]
    required_permissions = {
        'list': 'pdv.vender',
        'retrieve': 'pdv.vender',
        'create': 'config.global',
        'update': 'config.global',
        'partial_update': 'config.global',
        'destroy': 'config.global',
        'service_hours': 'config.atendente'
    }

    @action(detail=True, methods=['get', 'post'], url_path='service-hours')
    def service_hours(self, request, pk=None):
        store = self.get_object()
        
        if request.method == 'GET':
            hours = get_store_service_hours(store.id)
            return Response(hours)
            
        elif request.method == 'POST':
            # Check for specific permission if needed (already covered by required_permission)
            save_store_service_hours(store.id, request.data)
            
            # Audit the change
            log_critical_action(
                request.user, 
                'config.horario_atendimento', 
                target_object=store, 
                payload=request.data
            )
            
            return Response({"message": "Horário de atendimento atualizado com sucesso."})

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', None) == 'ADMIN':
            return Store.objects.all()
        if user.store:
            return Store.objects.filter(id=user.store.id)
        return Store.objects.none()


class StoreSettingsView(generics.RetrieveUpdateAPIView):
    """GET /api/store/me/  — returns & updates the current user's store."""
    serializer_class = StoreSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, JSONParser)
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        user = self.request.user
        store_id = self.request.headers.get('X-Store-ID')
        
        if store_id and (user.is_staff or getattr(user, 'role', None) == 'ADMIN'):
            try:
                return Store.objects.get(id=store_id)
            except Store.DoesNotExist:
                from rest_framework.exceptions import NotFound
                raise NotFound("Loja especificada não encontrada.")
                
        store = user.store
        if not store:
            from rest_framework.exceptions import NotFound
            raise NotFound("Nenhuma loja associada ao usuário.")
        return store
