"""
LGPD — Campo criptografado para Django ORM.
Criptografa transparentemente ao salvar e descriptografa ao ler.
"""
from django.db import models
from core.crypto import encrypt_value, decrypt_value


class EncryptedCharField(models.CharField):
    """CharField que criptografa o valor em repouso (AES-256)."""

    def get_prep_value(self, value):
        """Chamado antes de salvar no banco — criptografa."""
        value = super().get_prep_value(value)
        return encrypt_value(value) if value else value

    def from_db_value(self, value, expression, connection):
        """Chamado ao ler do banco — descriptografa."""
        return decrypt_value(value) if value else value

    def deconstruct(self):
        """Para migrations — comporta-se como CharField."""
        name, path, args, kwargs = super().deconstruct()
        return name, path, args, kwargs


class EncryptedTextField(models.TextField):
    """TextField que criptografa o valor em repouso (AES-256)."""

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        return encrypt_value(value) if value else value

    def from_db_value(self, value, expression, connection):
        return decrypt_value(value) if value else value

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        return name, path, args, kwargs
