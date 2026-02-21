from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied
from rest_framework import status
from rest_framework.response import Response
from . import subscription_service


class IsSubscribed(BasePermission):
    """
    Allows access only to stores with an active subscription (including trial).
    """
    message = 'Assinatura inativa ou expirada.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        store = getattr(request.user, 'store', None)
        sub = subscription_service.get_active_subscription(store)
        if sub is None or not sub.is_active:
            return False
        return True


def check_feature(store, action):
    """
    Helper to check a feature and raise a 402 response if blocked.
    Returns None if allowed, raises SubscriptionLimitExceeded if not.
    """
    allowed, reason, data = subscription_service.can_perform(store, action)
    if not allowed:
        raise SubscriptionLimitExceeded(detail=data, reason=reason)


class SubscriptionLimitExceeded(Exception):
    """Raised when a subscription limit is hit. Caught by views to return 402."""
    def __init__(self, detail=None, reason=None):
        self.detail = detail or {}
        self.reason = reason
        super().__init__(str(detail))
