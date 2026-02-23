from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer, RegisterSerializer
from stores.models import Store

from stores.views import MultiTenantViewSet
from core.permissions import HasRolePermission

class UserViewSet(MultiTenantViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [HasRolePermission]
    required_permissions = {
        'list': 'relatorio.vendas', # Gerente can see team
        'retrieve': 'pdv.vender', # Any operator can see own
        'me': 'pdv.vender',
        'create': 'usuario.gerenciar',
        'update': 'relatorio.vendas', # Allow Gerente to trigger
        'partial_update': 'relatorio.vendas',
        'destroy': 'usuario.gerenciar',
        'service_hours': 'config.atendente',
    }

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        
        # Ownership Rule for User Model:
        # GERENTE can only edit/delete:
        # 1. Themselves (request.user == obj)
        # 2. Operators they created (obj.operator == request.user)
        if request.user.role == 'GERENTE':
            if request.method in ['PUT', 'PATCH', 'DELETE']:
                is_self = request.user.whatsapp == obj.whatsapp
                is_subordinate = obj.operator and obj.operator.whatsapp == request.user.whatsapp
                
                if not (is_self or is_subordinate):
                    self.permission_denied(
                        request, 
                        message="Gerentes só podem editar seu próprio registro ou operadores criados por eles."
                    )

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        if request.method == 'PATCH':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'])
    def service_hours(self, request, pk=None):
        user = self.get_object()
        from stores.service_hours import get_user_service_hours, save_user_service_hours
        
        if request.method == 'POST':
            # Simplified validation: ensure correct keys
            allowed_keys = ['horario_inicio', 'horario_fim', 'dias_ativos', 'ativo']
            data = {k: v for k, v in request.data.items() if k in allowed_keys}
            save_user_service_hours(user.whatsapp, data)
            return Response({'status': 'Horário atualizado com sucesso', 'data': data})
            
        config = get_user_service_hours(user.whatsapp)
        return Response(config)

    def perform_create(self, serializer):
        serializer.save(store=self.request.user.store)

    def create(self, request, *args, **kwargs):
        # Feature gate: check operator limit before creating
        from billing.permissions import check_feature, SubscriptionLimitExceeded
        store = request.user.store
        try:
            check_feature(store, 'create_operator')
        except SubscriptionLimitExceeded as e:
            return Response(
                {'detail': e.detail, 'code': e.reason},
                status=status.HTTP_402_PAYMENT_REQUIRED
            )
        return super().create(request, *args, **kwargs)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create the store first
        business_name = serializer.validated_data.get('business_name')
        store = Store.objects.create(
            name=business_name,
            whatsapp=serializer.validated_data.get('whatsapp')
        )

        # Create user and link to store
        user = serializer.save(store=store, role='ADMIN')

        # Auto-start 7-day trial for the new store
        try:
            from billing.subscription_service import start_trial
            start_trial(store)
        except Exception:
            pass  # Don't fail registration if billing setup fails

        headers = self.get_success_headers(serializer.data)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED, headers=headers)
