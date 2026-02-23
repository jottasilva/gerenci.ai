from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'store', 'customer', 'customer_name_manual', 'total', 'status', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_method', 'store', 'created_at')
    search_fields = ('id', 'customer__name', 'customer_name_manual')
    inlines = [OrderItemInline]
