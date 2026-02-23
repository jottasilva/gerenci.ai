from django.contrib import admin
from .models import Customer

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'whatsapp', 'email', 'total_spent', 'store', 'is_active')
    list_filter = ('store', 'is_active')
    search_fields = ('name', 'whatsapp', 'email')
