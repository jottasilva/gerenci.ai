from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SubscriptionPlan, Subscription, UsageTracking, BillingEvent, LicenseKey
from .serializers import (
    SubscriptionPlanSerializer, SubscriptionSerializer,
    UsageTrackingSerializer, BillingEventSerializer
)
from . import subscription_service


class BillingViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def status(self, request):
        """
        GET /api/billing/status/
        Returns current subscription, usage, limits, and warnings.
        """
        store = request.user.store
        if not store:
            return Response({'error': 'No store linked to user.'}, status=400)

        sub = subscription_service.get_active_subscription(store)
        if sub is None:
            return Response({'error': 'No subscription found.', 'code': 'no_subscription'}, status=404)

        usage = subscription_service.get_usage(store)
        usage.refresh_counts() # Refresh from DB for 100% accuracy
        plan = sub.plan

        # Build limits & warnings
        limits = plan.limits if plan else {}
        warnings = {}
        if plan:
            for key, limit in limits.items():
                if isinstance(limit, int) and limit > 0:
                    count_map = {
                        'max_products': usage.products_count,
                        'max_operators': usage.operators_count,
                        'max_whatsapp': usage.whatsapp_numbers_count,
                    }
                    current = count_map.get(key, 0)
                    if current / limit >= 0.80:
                        warnings[key] = {
                            'current': current,
                            'limit': limit,
                            'pct': round(current / limit * 100, 1)
                        }

        return Response({
            'subscription': SubscriptionSerializer(sub).data,
            'usage': UsageTrackingSerializer(usage).data,
            'limits': limits,
            'warnings': warnings,
        })

    @action(detail=False, methods=['get'])
    def plans(self, request):
        """GET /api/billing/plans/ — Public list of all active plans."""
        plans = SubscriptionPlan.objects.filter(is_active=True)
        return Response(SubscriptionPlanSerializer(plans, many=True).data)

    @action(detail=False, methods=['post'])
    def subscribe(self, request):
        """
        POST /api/billing/subscribe/
        Body: { "plan_slug": "pro" }
        Admin only. Changes plan and records billing event.
        """
        if request.user.role != 'ADMIN' and not request.user.is_staff:
            return Response({'error': 'Apenas administradores podem alterar a assinatura.'}, status=403)

        plan_slug = request.data.get('plan_slug')
        if not plan_slug:
            return Response({'error': 'plan_slug é obrigatório.'}, status=400)

        store = request.user.store
        sub, result = subscription_service.upgrade_plan(store, plan_slug)
        if result != 'ok':
            return Response({'error': result}, status=400)

        return Response(SubscriptionSerializer(sub).data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """GET /api/billing/history/ — Billing event log."""
        store = request.user.store
        events = BillingEvent.objects.filter(store=store).order_by('-created_at')[:50]
        return Response(BillingEventSerializer(events, many=True).data)


from rest_framework import serializers

class LicenseKeySerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    
    class Meta:
        model = LicenseKey
        fields = ('id', 'key', 'plan', 'plan_name', 'duration_days', 'operators_limit', 'managers_limit', 'is_used', 'activated_at', 'store', 'created_at')
        read_only_fields = ('id', 'is_used', 'activated_at', 'store', 'created_at')

class LicenseKeyViewSet(viewsets.ModelViewSet):
    queryset = LicenseKey.objects.all().order_by('-created_at')
    serializer_class = LicenseKeySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Format key as PLANO-XXXX-XXXX
        import random, string
        plan = serializer.validated_data.get('plan')
        prefix = plan.slug.upper()
        
        # Determine limits: provided or from plan
        operators_limit = serializer.validated_data.get('operators_limit')
        if operators_limit is None:
            operators_limit = plan.limits.get('max_operators', 1)
            
        managers_limit = serializer.validated_data.get('managers_limit')
        if managers_limit is None:
            managers_limit = plan.limits.get('max_managers', 1)

        # If user didn't provide a key, generate one
        custom_key = serializer.validated_data.get('key')
        if not custom_key:
            random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4)) + '-' + \
                          ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            key_str = f"{prefix}-{random_part}"
        else:
            # Ensure prefix is present
            if not custom_key.startswith(f"{prefix}-"):
                key_str = f"{prefix}-{custom_key}"
            else:
                key_str = custom_key
                
        serializer.save(
            key=key_str,
            operators_limit=operators_limit,
            managers_limit=managers_limit
        )

    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.role == 'ADMIN':
            return super().get_queryset()
        return LicenseKey.objects.none()

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        """
        POST /api/license-keys/{id}/renew/
        Generates a new key with same plan and duration as this one.
        """
        old_key = self.get_object()
        import random, string
        new_key_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4)) + '-' + \
                      ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        
        new_key = LicenseKey.objects.create(
            key=f"{old_key.plan.slug.upper()}-{new_key_str}",
            plan=old_key.plan,
            duration_days=old_key.duration_days,
            operators_limit=old_key.operators_limit,
            managers_limit=old_key.managers_limit
        )
        return Response(LicenseKeySerializer(new_key).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def extend_subscription(self, request, pk=None):
        """
        POST /api/license-keys/{id}/extend_subscription/
        Directly extends the subscription of the store associated with this used key.
        """
        license_key = self.get_object()
        if not license_key.is_used or not license_key.store:
            return Response({'error': 'Esta chave ainda não foi utilizada ou não possui loja vinculada.'}, status=400)
            
        # Logic to update subscription (reuse upgrade_plan_with_duration)
        from billing.subscription_service import upgrade_plan_with_duration
        upgrade_plan_with_duration(
            license_key.store, 
            license_key.plan, 
            license_key.duration_days, 
            operators_limit=license_key.operators_limit,
            managers_limit=license_key.managers_limit
        )
        
        return Response({'message': f'Assinatura da loja {license_key.store.name} renovada por {license_key.duration_days} dias.'})

    @action(detail=False, methods=['post'])
    def activate(self, request):
        """
        POST /api/license-keys/activate/
        Body: { "key": "ABCD-1234" }
        """
        key_str = request.data.get('key')
        if not key_str:
            return Response({'error': 'Chave é obrigatória.'}, status=400)
            
        try:
            license_key = LicenseKey.objects.get(key=key_str)
        except LicenseKey.DoesNotExist:
            return Response({'error': 'Chave inválida.'}, status=404)
            
        store = request.user.store
        if not store:
            return Response({'error': 'Usuário não vinculado a uma loja.'}, status=400)
            
        success, message = license_key.activate(store)
        if not success:
            return Response({'error': message}, status=400)
            
        return Response({'message': message, 'plan': license_key.plan.name})

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """
    CRUD for Plans. 
    Public GET for listing active ones.
    Admin only for POST/PUT/DELETE.
    """
    queryset = SubscriptionPlan.objects.all().order_by('price')
    serializer_class = SubscriptionPlanSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), permissions.IsAdminUser()]

    def get_queryset(self):
        if self.request.user.is_authenticated and (self.request.user.is_staff or self.request.user.role == 'ADMIN'):
            return SubscriptionPlan.objects.all()
        return SubscriptionPlan.objects.filter(is_active=True)
