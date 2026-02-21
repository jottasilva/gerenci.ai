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
        fields = ('id', 'key', 'plan', 'plan_name', 'duration_days', 'is_used', 'activated_at', 'store', 'created_at')
        read_only_fields = ('id', 'is_used', 'activated_at', 'store', 'created_at')

class LicenseKeyViewSet(viewsets.ModelViewSet):
    queryset = LicenseKey.objects.all().order_by('-created_at')
    serializer_class = LicenseKeySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.role == 'ADMIN':
            return super().get_queryset()
        return LicenseKey.objects.none()

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

class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/plans/ — Public endpoint for plan listing."""
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]
