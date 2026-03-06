from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from .models import User
from .serializers import UserSerializer, RegisterSerializer
from stores.models import Store

from stores.views import MultiTenantViewSet
from core.permissions import HasRolePermission


class CustomTokenObtainPairView(TokenObtainPairView):
    """Override token view to detect users that need password setup."""
    
    def post(self, request, *args, **kwargs):
        whatsapp = request.data.get('whatsapp', '')
        
        # Check if user exists and needs password setup
        try:
            user = User.objects.get(whatsapp=whatsapp)
            if user.needs_password_setup or not user.has_usable_password():
                return Response({
                    'needs_password_setup': True,
                    'whatsapp': whatsapp,
                    'message': 'Este operador precisa criar uma senha de acesso.'
                }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            pass  # Let the parent handle the 401
        
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            from django.utils import timezone
            from datetime import timedelta
            
            # Save token to database
            access_token = response.data.get('access')
            user.session_token = access_token
            user.token_expires_at = timezone.now() + timedelta(hours=12)
            user.save()
            
            from core.audit import log_data_access
            log_data_access(request, 'LOGIN', 'user', whatsapp, user=user)
            
        return response


class SetupPasswordView(APIView):
    """Allow first-time password setup for operators."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        whatsapp = request.data.get('whatsapp', '')
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')
        
        if not whatsapp or not new_password:
            return Response(
                {'detail': 'WhatsApp e nova senha são obrigatórios.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != confirm_password:
            return Response(
                {'detail': 'As senhas não coincidem.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(whatsapp=whatsapp)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Operador não encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not user.needs_password_setup and user.has_usable_password():
            return Response(
                {'detail': 'Este operador já possui senha configurada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.needs_password_setup = False
        user.save()
        
        return Response({
            'detail': 'Senha criada com sucesso! Faça login.',
            'success': True
        })

class CheckUserView(APIView):
    """Check if user exists and their setup status before full login."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        whatsapp = request.data.get('whatsapp', '')
        if not whatsapp:
            return Response({'detail': 'WhatsApp é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(whatsapp=whatsapp)
            return Response({
                'exists': True,
                'needs_setup': user.needs_password_setup or not user.has_usable_password(),
                'first_name': user.first_name,
                'role': user.role
            })
        except User.DoesNotExist:
            return Response({'exists': False, 'needs_setup': False})

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

class GetSessionTokenView(APIView):
    """
    Internal route for n8n to retrieve a user's active session token.
    Requires X-Internal-Secret header.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        from django.conf import settings
        from django.utils import timezone
        
        # 0. IP Whitelisting Check
        ip = request.META.get('HTTP_X_FORWARDED_FOR')
        if ip:
            ip = ip.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
            
        if ip not in settings.ALLOWED_INTERNAL_IPS and '*' not in settings.ALLOWED_INTERNAL_IPS:
            return Response({'detail': f'Acesso negado: IP {ip} não autorizado.'}, status=status.HTTP_403_FORBIDDEN)
            
        # 1. Security Check
        provided_secret = request.headers.get('X-Internal-Secret')
        if not provided_secret or provided_secret != settings.INTERNAL_API_SECRET:
            return Response({'detail': 'Acesso negado: Segredo interno inválido.'}, status=status.HTTP_403_FORBIDDEN)
            
        # 2. Get User
        whatsapp = request.data.get('whatsapp')
        with open('debug_whatsapp.log', 'a') as f:
            f.write(f"DEBUG: Received whatsapp: {whatsapp}\n")
            
        if not whatsapp:
            return Response({'detail': 'WhatsApp é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(whatsapp=whatsapp)
        except User.DoesNotExist:
            with open('debug_whatsapp.log', 'a') as f:
                f.write(f"DEBUG: User not found for {whatsapp}, trying fallback\n")
            # Fallback: se começar com 55, tenta sem o prefixo
            if whatsapp.startswith('55') and len(whatsapp) >= 12:
                try:
                    user = User.objects.get(whatsapp=whatsapp[2:])
                    with open('debug_whatsapp.log', 'a') as f:
                        f.write(f"DEBUG: Found user with fallback: {user.whatsapp}\n")
                except User.DoesNotExist:
                    with open('debug_whatsapp.log', 'a') as f:
                        f.write(f"DEBUG: User not found even with fallback for {whatsapp}\n")
                    return Response({'detail': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'detail': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
            
        # 3. Validate Token
        if not user.session_token or not user.token_expires_at:
            return Response({'detail': 'Nenhuma sessão ativa encontrada para este usuário.'}, status=status.HTTP_404_NOT_FOUND)
            
        if user.token_expires_at < timezone.now():
            return Response({'detail': 'O token de sessão deste usuário expirou.'}, status=status.HTTP_403_FORBIDDEN)
            
        return Response({
            'whatsapp': user.whatsapp,
            'session_token': user.session_token,
            'expires_at': user.token_expires_at
        })
