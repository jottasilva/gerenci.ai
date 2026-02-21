from django.db import models
from stores.models import StoreModel

class Customer(StoreModel):
    name = models.CharField(max_length=255)
    whatsapp = models.CharField(max_length=20)
    email = models.EmailField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('store', 'whatsapp')

    def __str__(self):
        return f"{self.name} ({self.whatsapp})"
