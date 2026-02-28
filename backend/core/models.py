"""
LGPD — Models de infraestrutura para conformidade.
"""
from django.db import models


class DataAccessLog(models.Model):
    """
    Registra acessos a dados pessoais (LGPD Art. 46 e 50).
    Quem acessou, o que acessou, quando e de onde.
    """
    ACTION_CHOICES = [
        ('VIEW', 'Visualizou'),
        ('LIST', 'Listou'),
        ('EXPORT', 'Exportou'),
        ('EDIT', 'Editou'),
        ('DELETE', 'Excluiu'),
        ('SEARCH', 'Buscou'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
    ]

    user = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='data_access_logs'
    )
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    resource_type = models.CharField(max_length=50, help_text='Ex: customer, order, user')
    resource_id = models.CharField(max_length=100, blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['resource_type', 'resource_id']),
            models.Index(fields=['action', 'created_at']),
        ]
        verbose_name = 'Log de Acesso a Dados'
        verbose_name_plural = 'Logs de Acesso a Dados'

    def __str__(self):
        user_str = self.user.whatsapp if self.user else 'anon'
        return f"{user_str} {self.action} {self.resource_type}/{self.resource_id} @ {self.created_at:%Y-%m-%d %H:%M}"
