from django.contrib import admin
from .models import Category, Product, StockMovement

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'store')
    list_filter = ('store',)
    search_fields = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'price', 'stock', 'category', 'store', 'is_active')
    list_filter = ('store', 'category', 'is_active')
    search_fields = ('name', 'sku')

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'movement_type', 'quantity', 'operator', 'created_at')
    list_filter = ('movement_type', 'created_at')
    search_fields = ('product__name', 'reason')
