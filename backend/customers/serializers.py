from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    # Portuguese alias read fields
    nome = serializers.CharField(source='name', read_only=True)
    ativo = serializers.BooleanField(source='is_active', read_only=True)
    total_compras = serializers.DecimalField(source='total_spent', max_digits=12, decimal_places=2, read_only=True)
    endereco = serializers.CharField(source='address', read_only=True, allow_null=True)

    class Meta:
        model = Customer
        fields = (
            'id', 'name', 'whatsapp', 'email', 'address', 'total_spent', 'is_active',
            # Portuguese aliases (read-only, for frontend display)
            'nome', 'ativo', 'total_compras', 'endereco',
        )
        read_only_fields = ('store',)

    def to_internal_value(self, data):
        """Accept both English and Portuguese field names on write. Portuguese names take precedence."""
        mapped = dict(data)
        if 'nome' in mapped:
            mapped['name'] = mapped.pop('nome')
        if 'ativo' in mapped:
            mapped['is_active'] = mapped.pop('ativo')
        if 'total_compras' in mapped:
            mapped['total_spent'] = mapped.pop('total_compras')
        if 'endereco' in mapped:
            mapped['address'] = mapped.pop('endereco')
        return super().to_internal_value(mapped)
