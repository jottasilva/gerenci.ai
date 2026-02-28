from django.utils import timezone
from datetime import timedelta
from django.core.cache import cache


TRIAL_DAYS = 7
LIMIT_WARNING_THRESHOLD = 0.80  # 80% warning


def get_active_subscription(store):
    """Returns the Subscription for a store, or None. Uses cache."""
    if store is None:
        return None

    cache_key = f'subscription_{store.id}'
    sub = cache.get(cache_key)
    if sub is None:
        from billing.models import Subscription
        try:
            sub = Subscription.objects.select_related('plan').get(store=store)
            cache.set(cache_key, sub, timeout=60)  # Cache 60s
        except Subscription.DoesNotExist:
            return None
    return sub


def invalidate_subscription_cache(store):
    cache.delete(f'subscription_{store.id}')


def get_usage(store):
    """Returns UsageTracking for store, creates if missing."""
    from billing.models import UsageTracking
    usage, _ = UsageTracking.objects.get_or_create(store=store)
    return usage


def start_trial(store):
    """Creates a trial Subscription for a store. Called on registration."""
    from billing.models import Subscription, BillingEvent, SubscriptionPlan

    # Use the Básico plan as default trial plan
    try:
        trial_plan = SubscriptionPlan.objects.get(slug='basico')
    except SubscriptionPlan.DoesNotExist:
        trial_plan = None

    sub, created = Subscription.objects.get_or_create(
        store=store,
        defaults={
            'plan': trial_plan,
            'status': Subscription.STATUS_TRIAL,
            'start_date': timezone.now(),
            'trial_end': timezone.now() + timedelta(days=TRIAL_DAYS),
        }
    )

    if created:
        BillingEvent.objects.create(
            store=store,
            event_type='trial_start',
            payload={'trial_days': TRIAL_DAYS}
        )
        from billing.models import UsageTracking
        UsageTracking.objects.get_or_create(store=store)

    return sub


def can_perform(store, action):
    """
    Central gate: checks if a store can perform an action.
    Returns (allowed: bool, reason: str, data: dict)

    Actions: 'create_product', 'create_operator', 'create_manager', 'connect_whatsapp', 'api_access',
             'advanced_reports', 'multi_store'
    """
    if store is None:
        return False, 'no_store', {}

    sub = get_active_subscription(store)
    if sub is None:
        return False, 'no_subscription', {'message': 'Nenhuma assinatura encontrada.'}

    if not sub.is_active:
        return False, 'subscription_expired', {
            'message': 'Sua assinatura expirou. Renove para continuar.',
            'status': sub.status,
        }

    plan = sub.plan
    if plan is None:
        # Trial without a plan — basic operations only
        if action in ['create_operator', 'create_manager']:
            return False, 'plan_required', {'message': 'Este recurso requer um plano ativo.'}
        return True, 'ok', {}

    usage = get_usage(store)

    ACTION_MAP = {
        'create_product':    ('max_products',  usage.products_count),
        'create_operator':   ('max_operators', usage.operators_count),
        'create_manager':    ('max_managers',  0), # Limit checked below
        'connect_whatsapp':  ('max_whatsapp',  usage.whatsapp_numbers_count),
        'api_access':        ('api_access',    None),
        'advanced_reports':  ('advanced_reports', None),
        'multi_store':       ('multi_store',   None),
    }

    if action not in ACTION_MAP:
        return True, 'ok', {}

    limit_key, current_count = ACTION_MAP[action]

    # Boolean feature checks
    if current_count is None:
        allowed = plan.limits.get(limit_key, False)
        if not allowed:
            return False, 'feature_not_in_plan', {
                'feature': action,
                'plan': plan.name,
                'message': f'O recurso "{action}" não está disponível no plano {plan.name}.',
            }
        return True, 'ok', {}

    # Special Case: Operator Limit (Plan OR Key)
    limit = plan.limits.get(limit_key, 0)
    
    # If using create_operator/manager, check LicenseKey limits if available
    if action in ['create_operator', 'create_manager']:
        # Get the latest used key for this store
        from billing.models import LicenseKey
        key = LicenseKey.objects.filter(store=store, is_used=True).order_from('-activated_at').first()
        if key and key.operators_limit > limit:
            limit = key.operators_limit

    # Special Case: Manager count check
    if action == 'create_manager':
        from accounts.models import User
        count = User.objects.filter(store=store, role='GERENTE', is_active=True).count()
        current_count = count
        
        # Get custom limit from key if available
        from billing.models import LicenseKey
        key = LicenseKey.objects.filter(store=store, is_used=True).order_by('-activated_at').first()
        if key and key.managers_limit > limit:
            limit = key.managers_limit

    if limit == -1:  # Unlimited
        return True, 'ok', {}

    if current_count >= limit:
        _log_limit_event(store, action, limit_key, current_count, limit)
        return False, 'limit_exceeded', {
            'action': action,
            'limit': limit,
            'current': current_count,
            'plan': plan.name,
            'message': f'Seu plano {plan.name} permite apenas {limit} {_label(action)}.',
        }

    # 80% warning
    if limit > 0 and current_count / limit >= LIMIT_WARNING_THRESHOLD:
        _log_warning_event(store, action, limit_key, current_count, limit)

    return True, 'ok', {}


def upgrade_plan(store, new_plan_slug):
    """Upgrade or downgrade to a new plan. Upgrade: immediate. Downgrade: gated."""
    from billing.models import Subscription, BillingEvent, SubscriptionPlan

    try:
        new_plan = SubscriptionPlan.objects.get(slug=new_plan_slug)
    except SubscriptionPlan.DoesNotExist:
        return None, 'plan_not_found'

    sub = get_active_subscription(store)
    if sub is None:
        return None, 'no_subscription'

    old_plan = sub.plan
    old_slug = old_plan.slug if old_plan else None

    sub.plan = new_plan
    sub.status = Subscription.STATUS_ACTIVE
    sub.start_date = timezone.now()
    sub.end_date = timezone.now() + timedelta(days=30)
    sub.save()

    invalidate_subscription_cache(store)

    # Determine if upgrade or downgrade
    plan_order = ['free', 'basico', 'pro', 'enterprise']
    old_idx = plan_order.index(old_slug) if old_slug in plan_order else -1
    new_idx = plan_order.index(new_plan_slug) if new_plan_slug in plan_order else -1
    event_type = 'upgraded' if new_idx >= old_idx else 'downgraded'

    BillingEvent.objects.create(
        store=store,
        event_type=event_type,
        payload={'from': old_slug, 'to': new_plan_slug}
    )

    return sub, 'ok'


def upgrade_plan_with_duration(store, plan, days, operators_limit=None, managers_limit=None):
    """
    Activates/upgrades a plan for a store with a specific duration in days.
    """
    from billing.models import Subscription, BillingEvent
    sub, created = Subscription.objects.get_or_create(store=store)
    
    old_plan = sub.plan
    sub.plan = plan
    sub.status = Subscription.STATUS_ACTIVE
    
    # If it's the SAME plan already active, add to existing end_date.
    # If it's a DIFFERENT plan, REDEFINE (start duration from now).
    now = timezone.now()
    if old_plan == plan and sub.end_date and sub.end_date > now:
        sub.end_date += timedelta(days=days)
    else:
        # Redefine: new plan or expired sub start from today
        sub.end_date = now + timedelta(days=days)
        
    sub.save()
    invalidate_subscription_cache(store)
    
    # Record event
    BillingEvent.objects.create(
        store=store,
        event_type='upgraded',
        payload={
            'plan': plan.slug, 
            'duration': days, 
            'method': 'license_key',
            'operators_limit': operators_limit,
            'managers_limit': managers_limit
        }
    )
    
    return sub, 'ok'


def _log_limit_event(store, action, limit_key, current, limit):
    from billing.models import BillingEvent
    BillingEvent.objects.get_or_create(
        store=store,
        event_type='limit_reached',
        payload={'action': action, 'limit_key': limit_key, 'current': current, 'limit': limit}
    )


def _log_warning_event(store, action, limit_key, current, limit):
    from billing.models import BillingEvent
    # Only log once per action per day
    from django.utils import timezone as tz
    today = tz.now().date().isoformat()
    BillingEvent.objects.get_or_create(
        store=store,
        event_type='limit_warning',
        payload={'action': action, 'date': today}
    )


def _label(action):
    labels = {
        'create_product': 'produtos',
        'create_operator': 'operadores',
        'create_manager': 'gerentes',
        'connect_whatsapp': 'números WhatsApp',
    }
    return labels.get(action, action)
