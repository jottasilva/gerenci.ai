from rest_framework import serializers
from .models import Product, Category, StockMovement


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name')


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    supplier_name = serializers.ReadOnlyField(source='supplier.name')

    # Portuguese alias read fields for frontend compatibility
    nome = serializers.CharField(source='name', read_only=True)
    preco = serializers.DecimalField(source='price', max_digits=10, decimal_places=2, read_only=True)
    estoque = serializers.IntegerField(source='stock', read_only=True)
    estoque_min = serializers.IntegerField(source='min_stock', read_only=True)
    ativo = serializers.BooleanField(source='is_active', read_only=True)
    categoria = serializers.SerializerMethodField()

    def get_categoria(self, obj):
        return obj.category.name if obj.category else None

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'description', 'price', 'cost_price', 'stock', 'min_stock',
            'category', 'category_name', 'supplier', 'supplier_name', 'sku', 'image', 'is_active',
            # Portuguese aliases (read-only, for frontend)
            'nome', 'preco', 'estoque', 'estoque_min', 'ativo', 'categoria',
        )
        read_only_fields = ('store',)

    def to_internal_value(self, data):
        """Accept both English and Portuguese field names on write."""
        # QueryDict.dict() returns the last value for each key, avoiding the list-of-values issue ['true']
        if hasattr(data, 'dict'):
            mapped = data.dict()
        else:
            mapped = dict(data)

        # Map Portuguese -> English for write operations (Portuguese takes precedence)
        if 'nome' in mapped and 'name' not in mapped:
            mapped['name'] = mapped.pop('nome')
        if 'preco' in mapped and 'price' not in mapped:
            mapped['price'] = mapped.pop('preco')
        if 'estoque' in mapped and 'stock' not in mapped:
            mapped['stock'] = mapped.pop('estoque')
        if 'estoque_min' in mapped and 'min_stock' not in mapped:
            mapped['min_stock'] = mapped.pop('estoque_min')
        if 'stock_min' in mapped and 'min_stock' not in mapped:
            mapped['min_stock'] = mapped.pop('stock_min')
        if 'ativo' in mapped and 'is_active' not in mapped:
            mapped['is_active'] = mapped.pop('ativo')

        # Clean up Portuguese aliases if they were not popped
        for key in ('nome', 'preco', 'estoque', 'estoque_min', 'stock_min', 'ativo', 'categoria', 'categoria_name', 'nome_categoria'):
            mapped.pop(key, None)

        # Sanitize nullable FK fields: 'none', 'null', '' -> None
        for fk_field in ('category', 'supplier'):
            val = mapped.get(fk_field)
            if isinstance(val, str) and val.lower() in ('none', 'null', ''):
                mapped[fk_field] = None

        return super().to_internal_value(mapped)


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    operator_name = serializers.ReadOnlyField(source='operator.first_name')

    # Portuguese alias
    tipo = serializers.CharField(source='movement_type', read_only=True)
    quantidade = serializers.IntegerField(source='quantity', read_only=True)
    motivo = serializers.CharField(source='reason', read_only=True, allow_null=True)

    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ('store',)

    def to_internal_value(self, data):
        mapped = dict(data)
        if 'tipo' in mapped and 'movement_type' not in mapped:
            mapped['movement_type'] = mapped.pop('tipo')
        if 'quantidade' in mapped and 'quantity' not in mapped:
            mapped['quantity'] = mapped.pop('quantidade')
        if 'motivo' in mapped and 'reason' not in mapped:
            mapped['reason'] = mapped.pop('motivo')
        return super().to_internal_value(mapped)
