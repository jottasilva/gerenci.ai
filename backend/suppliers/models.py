from django.db import models
from stores.models import StoreModel


class Supplier(StoreModel):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=30, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    cnpj = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        unique_together = ('store', 'name')

    def __str__(self):
        return self.name
