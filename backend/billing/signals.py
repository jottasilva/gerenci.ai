from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F, Value
from django.db.models.functions import Greatest


@receiver(post_save, sender='products.Product')
def update_products_count_on_save(sender, instance, created, **kwargs):
    if created and instance.store_id:
        from billing.models import UsageTracking
        UsageTracking.objects.update_or_create(store=instance.store, defaults={})
        UsageTracking.objects.filter(store=instance.store).update(
            products_count=F('products_count') + 1
        )


@receiver(post_delete, sender='products.Product')
def update_products_count_on_delete(sender, instance, **kwargs):
    if instance.store_id:
        from billing.models import UsageTracking
        UsageTracking.objects.filter(store=instance.store).update(
            products_count=Greatest(F('products_count') - 1, Value(0))
        )


@receiver(post_save, sender='accounts.User')
def update_operators_count_on_save(sender, instance, created, **kwargs):
    if created and instance.role in ('GERENTE', 'VENDEDOR') and instance.store_id:
        from billing.models import UsageTracking
        UsageTracking.objects.update_or_create(store=instance.store, defaults={})
        UsageTracking.objects.filter(store=instance.store).update(
            operators_count=F('operators_count') + 1
        )


@receiver(post_delete, sender='accounts.User')
def update_operators_count_on_delete(sender, instance, **kwargs):
    if instance.role in ('GERENTE', 'VENDEDOR') and instance.store_id:
        from billing.models import UsageTracking
        UsageTracking.objects.filter(store=instance.store).update(
            operators_count=Greatest(F('operators_count') - 1, Value(0))
        )
