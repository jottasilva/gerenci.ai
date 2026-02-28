"""
LGPD — Job de limpeza automática de dados expirados.
Rodar diariamente via cron:
  0 3 * * * cd /path/to/backend && python manage.py lgpd_cleanup
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = 'LGPD: Limpa dados expirados conforme política de retenção'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Simula sem alterar dados')

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        now = timezone.now()
        prefix = '[DRY-RUN] ' if dry_run else ''

        self.stdout.write(self.style.MIGRATE_HEADING(f'{prefix}LGPD Cleanup — {now:%Y-%m-%d %H:%M}'))

        # 1. PIX QR Codes — apagar após 72 horas
        from orders.models import Order
        stale_pix = Order.objects.filter(
            pix_qr_code__isnull=False,
            created_at__lt=now - timedelta(hours=72)
        ).exclude(pix_qr_code='')
        count = stale_pix.count()
        if not dry_run:
            stale_pix.update(pix_qr_code=None)
        self.stdout.write(f'  {prefix}PIX QR codes limpos: {count}')

        # 2. Endereços de entrega — anonimizar após 90 dias
        old_deliveries = Order.objects.filter(
            delivery_address__isnull=False,
            created_at__lt=now - timedelta(days=90)
        ).exclude(delivery_address='').exclude(delivery_address='[ANONIMIZADO]')
        count = old_deliveries.count()
        if not dry_run:
            old_deliveries.update(delivery_address='[ANONIMIZADO]')
        self.stdout.write(f'  {prefix}Endereços de entrega anonimizados: {count}')

        # 3. Logs de acesso a dados — deletar após 1 ano
        try:
            from core.models import DataAccessLog
            old_logs = DataAccessLog.objects.filter(
                created_at__lt=now - timedelta(days=365)
            )
            count = old_logs.count()
            if not dry_run:
                old_logs.delete()
            self.stdout.write(f'  {prefix}Logs de acesso excluídos: {count}')
        except Exception:
            self.stdout.write('  DataAccessLog não disponível ainda (migration pendente)')

        # 4. Clientes inativos há 2+ anos — marcar para notificação
        from customers.models import Customer
        two_years_ago = now - timedelta(days=730)
        try:
            inactive_customers = Customer.objects.filter(
                is_active=True,
                data_retention_notified=False,
                created_at__lt=two_years_ago,
            ).exclude(
                orders__created_at__gte=two_years_ago
            )
            count = inactive_customers.count()
            if not dry_run:
                inactive_customers.update(data_retention_notified=True)
            self.stdout.write(f'  {prefix}Clientes inativos marcados para notificação: {count}')
        except Exception:
            self.stdout.write('  Campos LGPD do Customer não disponíveis ainda (migration pendente)')

        self.stdout.write(self.style.SUCCESS(f'\n{prefix}Cleanup concluído.'))
