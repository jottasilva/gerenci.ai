from django.db import models
from stores.models import StoreModel

class Order(StoreModel):
    STATUS_CHOICES = [
        ('ABERTO', 'Aberto'),
        ('CONFIRMADO', 'Confirmado'),
        ('EM_PREPARO', 'Em Preparo'),
        ('PRONTO', 'Pronto'),
        ('SAIU_ENTREGA', 'Saiu para Entrega'),
        ('ENTREGUE', 'Entregue'),
        ('CANCELADO', 'Cancelado'),
    ]
    PAYMENT_CHOICES = [
        ('DINHEIRO', 'Dinheiro'),
        ('PIX', 'PIX'),
        ('CARTAO_DEBITO', 'Cartão de Débito'),
        ('CARTAO_CREDITO', 'Cartão de Crédito'),
        ('FIADO', 'Fiado'),
    ]
    
    customer = models.ForeignKey('customers.Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    customer_name_manual = models.CharField(max_length=255, null=True, blank=True) # For "Balcão"
    total = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ABERTO')
    operator = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='processed_orders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order {self.id} - {self.store.name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255) # Snapshot
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.quantity}x {self.product_name}"
