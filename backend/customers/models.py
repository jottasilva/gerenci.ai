from django.db import models
from stores.models import StoreModel
from core.fields import EncryptedCharField

class Customer(StoreModel):
    name = models.CharField(max_length=255)
    whatsapp = models.CharField(max_length=20, primary_key=True)
    email = models.EmailField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    cpf_cnpj = EncryptedCharField(max_length=255, null=True, blank=True)

    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Platform Management
    business_name = models.CharField(max_length=255, null=True, blank=True)
    business_segment = models.CharField(max_length=100, null=True, blank=True)
    PLAN_CHOICES = [('BRONZE', 'Bronze'), ('SILVER', 'Silver'), ('GOLD', 'Gold')]
    subscription_plan = models.CharField(max_length=10, choices=PLAN_CHOICES, default='BRONZE')
    agent_active = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # ─── LGPD Consent Fields (Art. 7º, 8º) ─────────────────────────────
    privacy_accepted = models.BooleanField(default=False, help_text='Aceite da Política de Privacidade')
    privacy_accepted_at = models.DateTimeField(null=True, blank=True)
    privacy_version = models.CharField(max_length=20, default='1.0', help_text='Versão da política aceita')
    marketing_consent = models.BooleanField(default=False, help_text='Consente receber marketing via WhatsApp')
    marketing_consent_at = models.DateTimeField(null=True, blank=True)
    data_retention_notified = models.BooleanField(default=False, help_text='Notificado sobre retenção/exclusão')


    class Meta:
        unique_together = ('store', 'whatsapp')

    def __str__(self):
        return f"{self.name} ({self.whatsapp})"
