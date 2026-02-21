from django.contrib import admin
from .models import SubscriptionPlan, Subscription, UsageTracking, BillingEvent


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'price', 'is_active', 'is_highlighted']
    list_editable = ['is_active', 'is_highlighted']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['store', 'plan', 'status', 'trial_end', 'end_date']
    list_filter = ['status']
    search_fields = ['store__name']


@admin.register(UsageTracking)
class UsageTrackingAdmin(admin.ModelAdmin):
    list_display = ['store', 'products_count', 'operators_count', 'whatsapp_numbers_count', 'last_updated']


@admin.register(BillingEvent)
class BillingEventAdmin(admin.ModelAdmin):
    list_display = ['store', 'event_type', 'created_at']
    list_filter = ['event_type']
