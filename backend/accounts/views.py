from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer, RegisterSerializer
from stores.models import Store

from stores.views import MultiTenantViewSet

class UserViewSet(MultiTenantViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        if request.method == 'PATCH':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

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
