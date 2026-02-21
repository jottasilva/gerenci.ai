from django.db import models

class Store(models.Model):
    name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to='stores/logos/', null=True, blank=True)
    whatsapp = models.CharField(max_length=20, unique=True)
    address = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    # Extra settings fields for Configurações page
    cnpj = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    instagram = models.CharField(max_length=100, null=True, blank=True)
    website = models.URLField(null=True, blank=True)
    welcome_message = models.TextField(null=True, blank=True)
    out_of_hours_message = models.TextField(null=True, blank=True)
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    bot_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class StoreModel(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='%(class)ss')
    
    class Meta:
        abstract = True
