from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    # Portuguese aliases for read
    produto_id = serializers.PrimaryKeyRelatedField(source='product', read_only=True)
    nome = serializers.CharField(source='product_name', read_only=True)
    quantidade = serializers.IntegerField(source='quantity', read_only=True)
    preco_unit = serializers.DecimalField(source='unit_price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = '__all__'

    def to_internal_value(self, data):
        mapped = dict(data)
        if 'produto_id' in mapped and 'product' not in mapped:
            mapped['product'] = mapped.pop('produto_id')
        if 'nome' in mapped and 'product_name' not in mapped:
            mapped['product_name'] = mapped.pop('nome')
        if 'quantidade' in mapped and 'quantity' not in mapped:
            mapped['quantity'] = mapped.pop('quantidade')
        if 'preco_unit' in mapped and 'unit_price' not in mapped:
            mapped['unit_price'] = mapped.pop('preco_unit')
        return super().to_internal_value(mapped)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.ReadOnlyField(source='customer.name')

    # Portuguese aliases for read
    cliente = serializers.PrimaryKeyRelatedField(source='customer', read_only=True)
    cliente_name = serializers.ReadOnlyField(source='customer.name')
    desconto = serializers.DecimalField(source='discount', max_digits=12, decimal_places=2, read_only=True)
    forma_pagto = serializers.CharField(source='payment_method', read_only=True)
    valor_recebido = serializers.DecimalField(source='received_amount', max_digits=12, decimal_places=2, read_only=True)
    troco = serializers.DecimalField(source='change_amount', max_digits=12, decimal_places=2, read_only=True)
    tipo_entrega = serializers.CharField(source='delivery_method', read_only=True)
    taxa_entrega = serializers.DecimalField(source='delivery_fee', max_digits=12, decimal_places=2, read_only=True)
    endereco_entrega = serializers.CharField(source='delivery_address', read_only=True)
    operador_nome = serializers.ReadOnlyField(source='operator.first_name')
    pix_qrcode = serializers.CharField(source='pix_qr_code', read_only=True)
    itens = OrderItemSerializer(source='items', many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('store', 'operator')

    def to_internal_value(self, data):
        mapped = dict(data)
        if 'cliente' in mapped and 'customer' not in mapped:
            mapped['customer'] = mapped.pop('cliente')
        if 'desconto' in mapped and 'discount' not in mapped:
            mapped['discount'] = mapped.pop('desconto')
        if 'forma_pagto' in mapped and 'payment_method' not in mapped:
            mapped['payment_method'] = mapped.pop('forma_pagto')
        if 'valor_recebido' in mapped and 'received_amount' not in mapped:
            mapped['received_amount'] = mapped.pop('valor_recebido')
        if 'troco' in mapped and 'change_amount' not in mapped:
            mapped['change_amount'] = mapped.pop('troco')
        if 'tipo_entrega' in mapped and 'delivery_method' not in mapped:
            mapped['delivery_method'] = mapped.pop('tipo_entrega')
        if 'taxa_entrega' in mapped and 'delivery_fee' not in mapped:
            mapped['delivery_fee'] = mapped.pop('taxa_entrega')
        if 'endereco_entrega' in mapped and 'delivery_address' not in mapped:
            mapped['delivery_address'] = mapped.pop('endereco_entrega')
        if 'pix_qrcode' in mapped and 'pix_qr_code' not in mapped:
            mapped['pix_qr_code'] = mapped.pop('pix_qrcode')
        return super().to_internal_value(mapped)
