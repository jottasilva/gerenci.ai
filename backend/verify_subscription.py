import os
import django
from django.utils import timezone
from datetime import timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from billing.models import Subscription, SubscriptionPlan
from stores.models import Store
from billing.subscription_service import upgrade_plan_with_duration, invalidate_subscription_cache

def test_subscription_redefinition():
    store = Store.objects.first()
    if not store:
        print("No store found to test.")
        return

    # 1. Setup - Create basic and pro plans
    basico, _ = SubscriptionPlan.objects.get_or_create(slug='basico', defaults={'name': 'Básico', 'price': 10})
    pro, _ = SubscriptionPlan.objects.get_or_create(slug='pro', defaults={'name': 'Pro', 'price': 30})

    # 2. Case: Same Plan (Append)
    print("\n--- Case 1: Same Plan (Append) ---")
    sub, _ = Subscription.objects.get_or_create(store=store)
    sub.plan = basico
    sub.status = 'active'
    sub.end_date = timezone.now() + timedelta(days=5) # 5 days left
    sub.save()
    
    print(f"  Initial end date: {sub.end_date:%Y-%m-%d}")
    upgrade_plan_with_duration(store, basico, 30)
    sub.refresh_from_db()
    print(f"  After append (30 days): {sub.end_date:%Y-%m-%d} (Expected ~35 days from now)")
    
    # 3. Case: Different Plan (Redefine)
    print("\n--- Case 2: Different Plan (Redefine) ---")
    print(f"  Current plan: {sub.plan.slug}, End date: {sub.end_date:%Y-%m-%d}")
    upgrade_plan_with_duration(store, pro, 30)
    sub.refresh_from_db()
    expected_end = (timezone.now() + timedelta(days=30)).date()
    print(f"  After redefine to PRO (30 days): {sub.end_date:%Y-%m-%d} (Expected: {expected_end:%Y-%m-%d})")
    
    if sub.end_date.date() == expected_end:
        print("  SUCCESS: Plan redefined correctly.")
    else:
        print("  FAIL: Duration was appended instead of redefined.")

if __name__ == '__main__':
    test_subscription_redefinition()
