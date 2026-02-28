from django.db import models
from stores.models import StoreModel

class DiscountCoupon(StoreModel):
    code = models.CharField(max_length=30)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, help_text='Porcentagem de desconto (0-100)')
    is_active = models.BooleanField(default=True)
    max_uses = models.IntegerField(default=0, help_text='0 = ilimitado')
    times_used = models.IntegerField(default=0)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('store', 'code')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} ({self.percentage}%)"

    @property
    def is_valid(self):
        from django.utils import timezone
        now = timezone.now()
        if not self.is_active:
            return False
        if self.max_uses > 0 and self.times_used >= self.max_uses:
            return False
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        return True


class Order(StoreModel):
    STATUS_CHOICES = [
        ('REALIZADO', 'Realizado'),
        ('PREPARANDO', 'Preparando'),
        ('ENVIADO', 'Enviado'),
        ('FINALIZADO', 'Finalizado'),
        ('CANCELADO', 'Cancelado'),
    ]
    PAYMENT_CHOICES = [
        ('DINHEIRO', 'Dinheiro'),
        ('PIX', 'PIX'),
        ('CARTAO_DEBITO', 'Cartão de Débito'),
        ('CARTAO_CREDITO', 'Cartão de Crédito'),
        ('FIADO', 'Fiado'),
    ]
    
    DELIVERY_CHOICES = [
        ('BALCAO', 'Balcão'),
        ('ENTREGA', 'Entrega'),
        ('RETIRADA', 'Retirada'),
    ]

    customer = models.ForeignKey('customers.Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    customer_name_manual = models.CharField(max_length=255, null=True, blank=True) # For "Balcão"
    total = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Porcentagem de desconto aplicada')
    discount_coupon = models.ForeignKey(DiscountCoupon, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES)
    received_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    change_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='BALCAO')
    delivery_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_address = models.TextField(null=True, blank=True)
    pix_qr_code = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REALIZADO')
    operator = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='processed_orders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

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
