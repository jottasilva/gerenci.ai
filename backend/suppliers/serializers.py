from rest_framework import serializers
from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ('id', 'name', 'phone', 'email', 'cnpj', 'address', 'is_active', 'created_at')
        read_only_fields = ('store',)
