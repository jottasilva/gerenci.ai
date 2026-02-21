from django.db import models
from django.utils import timezone
from datetime import timedelta


class SubscriptionPlan(models.Model):
    SLUG_CHOICES = [
        ('basico', 'Básico'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise'),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, choices=SLUG_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_highlighted = models.BooleanField(default=False)  # For "PRO" badge on frontend

    # JSON with feature limits:
    # {
    #   "max_products": 500,       # -1 = unlimited
    #   "max_operators": 2,
    #   "max_whatsapp": 1,
    #   "advanced_reports": false,
    #   "api_access": false,
    #   "multi_store": false,
    #   "priority_support": false,
    #   "dedicated_support": false,
    #   "sla": false
    # }
    limits = models.JSONField(default=dict)
    features = models.JSONField(default=list)  # List of human-readable feature strings

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['price']

    def __str__(self):
        return f"{self.name} — R${self.price}/mês"

    def get_limit(self, key, default=0):
        return self.limits.get(key, default)

    def is_unlimited(self, key):
        return self.limits.get(key, 0) == -1


class Subscription(models.Model):
    STATUS_TRIAL = 'trial'
    STATUS_ACTIVE = 'active'
    STATUS_CANCELED = 'canceled'
    STATUS_EXPIRED = 'expired'

    STATUS_CHOICES = [
        (STATUS_TRIAL, 'Trial'),
        (STATUS_ACTIVE, 'Ativo'),
        (STATUS_CANCELED, 'Cancelado'),
        (STATUS_EXPIRED, 'Expirado'),
    ]

    store = models.OneToOneField('stores.Store', on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_TRIAL)

    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    trial_end = models.DateTimeField(null=True, blank=True)

    payment_provider_id = models.CharField(max_length=255, blank=True)  # Stripe/Stripe-like ID
    canceled_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.store.name} — {self.get_status_display()}"

    @property
    def is_active(self):
        """Returns True if subscription grants access."""
        if self.status == self.STATUS_TRIAL:
            return self.trial_end is None or self.trial_end > timezone.now()
        if self.status == self.STATUS_ACTIVE:
            return self.end_date is None or self.end_date > timezone.now()
        return False

    @property
    def days_remaining(self):
        if self.status == self.STATUS_TRIAL and self.trial_end:
            delta = self.trial_end - timezone.now()
            return max(0, delta.days)
        if self.status == self.STATUS_ACTIVE and self.end_date:
            delta = self.end_date - timezone.now()
            return max(0, delta.days)
        return None

    @property
    def effective_plan(self):
        """Returns the plan, or None if on trial without a plan."""
        return self.plan


class UsageTracking(models.Model):
    store = models.OneToOneField('stores.Store', on_delete=models.CASCADE, related_name='usage')
    products_count = models.IntegerField(default=0)
    operators_count = models.IntegerField(default=0)
    whatsapp_numbers_count = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Usage: {self.store.name}"

    def refresh_counts(self):
        """Recount all usage from DB."""
        from products.models import Product
        from accounts.models import User

        self.products_count = Product.objects.filter(store=self.store).count()
        self.operators_count = User.objects.filter(store=self.store, role__in=['GERENTE', 'VENDEDOR']).count()
        self.save(update_fields=['products_count', 'operators_count', 'whatsapp_numbers_count', 'last_updated'])


class BillingEvent(models.Model):
    EVENT_TYPES = [
        ('trial_start', 'Trial Iniciado'),
        ('trial_end', 'Trial Encerrado'),
        ('subscribed', 'Assinatura Ativada'),
        ('upgraded', 'Plano Atualizado'),
        ('downgraded', 'Plano Reduzido'),
        ('canceled', 'Assinatura Cancelada'),
        ('expired', 'Assinatura Expirada'),
        ('limit_reached', 'Limite Atingido'),
        ('limit_warning', 'Aviso de Limite (80%)'),
    ]

    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='billing_events')
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.store.name} — {self.event_type} @ {self.created_at:%Y-%m-%d}"


class LicenseKey(models.Model):
    key = models.CharField(max_length=50, unique=True)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    duration_days = models.IntegerField(default=30)
    
    is_used = models.BooleanField(default=False)
    activated_at = models.DateTimeField(null=True, blank=True)
    store = models.ForeignKey('stores.Store', on_delete=models.SET_NULL, null=True, blank=True, related_name='activated_keys')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.key} ({self.plan.name})"

    def activate(self, store):
        if self.is_used:
            return False, "Esta chave já foi utilizada."
        
        self.is_used = True
        self.activated_at = timezone.now()
        self.store = store
        self.save()
        
        # Logic to update subscription
        from billing.subscription_service import upgrade_plan_with_duration
        upgrade_plan_with_duration(store, self.plan, self.duration_days)
        
        return True, "Plano ativado com sucesso!"
