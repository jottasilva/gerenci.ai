from django.db import models
from stores.models import StoreModel

class Category(StoreModel):
    name = models.CharField(max_length=100)
    
    class Meta:
        verbose_name_plural = 'Categories'
        unique_together = ('store', 'name')

    def __str__(self):
        return self.name

class Product(StoreModel):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    min_stock = models.IntegerField(default=10)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    sku = models.CharField(max_length=50, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class StockMovement(StoreModel):
    TYPES = [('ENTRADA', 'Entrada'), ('SAIDA', 'Saída'), ('AJUSTE', 'Ajuste')]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=10, choices=TYPES)
    quantity = models.IntegerField()
    reason = models.CharField(max_length=255, null=True, blank=True)
    operator = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
