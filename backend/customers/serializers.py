from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    # Portuguese alias read fields
    nome = serializers.CharField(source='name', read_only=True)
    id = serializers.CharField(source='whatsapp', read_only=True)
    ativo = serializers.BooleanField(source='is_active', read_only=True)
    total_compras = serializers.DecimalField(source='total_spent', max_digits=12, decimal_places=2, read_only=True)
    endereco = serializers.CharField(source='address', read_only=True, allow_null=True)
    cpf_cnpj = serializers.CharField(read_only=True, allow_null=True)
    negocio = serializers.CharField(source='business_name', read_only=True, allow_null=True)
    segmento = serializers.CharField(source='business_segment', read_only=True, allow_null=True)
    plano = serializers.CharField(source='subscription_plan', read_only=True)
    agente_ativo = serializers.BooleanField(source='agent_active', read_only=True)

    class Meta:
        model = Customer
        fields = (
            'id', 'whatsapp', 'name', 'email', 'address', 'total_spent', 'is_active',
            'business_name', 'business_segment', 'subscription_plan', 'agent_active',
            # Portuguese aliases (read-only, for frontend display)
            'nome', 'ativo', 'total_compras', 'endereco', 'cpf_cnpj',
            'negocio', 'segmento', 'plano', 'agente_ativo',
        )
        read_only_fields = ('store', 'total_spent')

    def to_internal_value(self, data):
        """Accept both English and Portuguese field names on write. Portuguese names take precedence."""
        mapped = dict(data)
        if 'nome' in mapped and 'name' not in mapped:
            mapped['name'] = mapped.pop('nome')
        if 'ativo' in mapped and 'is_active' not in mapped:
            mapped['is_active'] = mapped.pop('ativo')
        if 'total_compras' in mapped and 'total_spent' not in mapped:
            mapped['total_spent'] = mapped.pop('total_compras')
        if 'endereco' in mapped and 'address' not in mapped:
            mapped['address'] = mapped.pop('endereco')
        if 'cpf_cnpj' in mapped:
            # cpf_cnpj maps directly but we ensure it's handled if needed
            pass
        if 'negocio' in mapped and 'business_name' not in mapped:
            mapped['business_name'] = mapped.pop('negocio')
        if 'segmento' in mapped and 'business_segment' not in mapped:
            mapped['business_segment'] = mapped.pop('segmento')
        if 'plano' in mapped and 'subscription_plan' not in mapped:
            mapped['subscription_plan'] = mapped.pop('plano')
        if 'agente_ativo' in mapped and 'agent_active' not in mapped:
            mapped['agent_active'] = mapped.pop('agente_ativo')

        # Clean up Portuguese aliases if they were not popped
        for key in ('nome', 'ativo', 'total_compras', 'endereco'):
            mapped.pop(key, None)
        return super().to_internal_value(mapped)
