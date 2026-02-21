from rest_framework import serializers
from .models import SubscriptionPlan, Subscription, UsageTracking, BillingEvent


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'slug', 'price', 'limits', 'features', 'is_highlighted', 'description']


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    is_active = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = ['id', 'plan', 'status', 'start_date', 'end_date', 'trial_end',
                  'is_active', 'days_remaining', 'created_at']

    def get_is_active(self, obj):
        return obj.is_active

    def get_days_remaining(self, obj):
        return obj.days_remaining


class UsageTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsageTracking
        fields = ['products_count', 'operators_count', 'whatsapp_numbers_count', 'last_updated']


class BillingEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingEvent
        fields = ['id', 'event_type', 'payload', 'created_at']


class BillingStatusSerializer(serializers.Serializer):
    """Combined billing status response."""
    subscription = SubscriptionSerializer()
    usage = UsageTrackingSerializer()
    limits = serializers.DictField()
    warnings = serializers.DictField()  # Fields approaching 80% limit
