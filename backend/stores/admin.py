from django.contrib import admin
from .models import Store

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('name', 'whatsapp', 'cnpj', 'is_active', 'created_at')
    search_fields = ('name', 'whatsapp', 'cnpj')
    list_filter = ('is_active',)
