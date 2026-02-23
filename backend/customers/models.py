from django.db import models
from stores.models import StoreModel

class Customer(StoreModel):
    name = models.CharField(max_length=255)
    whatsapp = models.CharField(max_length=20, primary_key=True)
    email = models.EmailField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    cpf_cnpj = models.CharField(max_length=20, null=True, blank=True)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Platform Management
    business_name = models.CharField(max_length=255, null=True, blank=True)
    business_segment = models.CharField(max_length=100, null=True, blank=True)
    PLAN_CHOICES = [('BRONZE', 'Bronze'), ('SILVER', 'Silver'), ('GOLD', 'Gold')]
    subscription_plan = models.CharField(max_length=10, choices=PLAN_CHOICES, default='BRONZE')
    agent_active = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('store', 'whatsapp')

    def __str__(self):
        return f"{self.name} ({self.whatsapp})"
