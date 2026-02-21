from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, whatsapp, password=None, **extra_fields):
        if not whatsapp:
            raise ValueError('O WhatsApp deve ser informado')
        user = self.model(whatsapp=whatsapp, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, whatsapp, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(whatsapp, password, **extra_fields)

class User(AbstractUser):
    username = None
    whatsapp = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=20, choices=[
        ('ADMIN', 'Admin'),
        ('GERENTE', 'Gerente'),
        ('VENDEDOR', 'Vendedor'),
    ], default='VENDEDOR')
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, null=True, blank=True, related_name='members')
    ativo = models.BooleanField(default=True)

    USERNAME_FIELD = 'whatsapp'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return f"{self.first_name} ({self.whatsapp})"
