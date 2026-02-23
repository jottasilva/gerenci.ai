from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('whatsapp', 'first_name', 'last_name', 'role', 'store', 'is_staff', 'ativo')
    list_filter = ('role', 'is_staff', 'ativo', 'store')
    search_fields = ('whatsapp', 'first_name', 'last_name')
    ordering = ('whatsapp',)
