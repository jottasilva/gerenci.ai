import logging
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import json

# Specialized logger for audit trail
audit_logger = logging.getLogger('audit_trail')

def log_critical_action(user, action, target_object=None, reason=None, payload=None):
    """
    Utility to record critical business actions.
    Uses Django Admin Log as a base (schema-preserving) and an external logger.
    """
    timestamp = timezone.now()
    log_msg = f"AUDIT | {timestamp} | User: {user.whatsapp if hasattr(user, 'whatsapp') else user.pk} | Action: {action} | Reason: {reason} | Payload: {payload}"
    
    # 1. Log to Python logging (dedicated file/stream)
    audit_logger.info(log_msg)
    
    # 2. Log to Django Admin Log (Database)
    try:
        if target_object:
            content_type = ContentType.objects.get_for_model(target_object)
            
            # Decide which method to use (Django version / library dependent)
            if hasattr(LogEntry.objects, 'log_action'):
                LogEntry.objects.log_action(
                    user_id=user.pk,
                    content_type_id=content_type.pk,
                    object_id=target_object.pk,
                    object_repr=str(target_object),
                    action_flag=CHANGE,
                    change_message=json.dumps({
                        'action': action,
                        'reason': reason,
                        'payload': payload,
                        'timestamp': str(timestamp)
                    })
                )
            elif hasattr(LogEntry.objects, 'log_actions'):
                # log_actions expects a queryset or a single object if single_object=True
                # But it's usually for bulk. If we have it, we use it as fallback if log_action is missing
                from django.db.models import QuerySet
                LogEntry.objects.log_actions(
                    user_id=user.pk,
                    queryset=[target_object] if not isinstance(target_object, (list, QuerySet)) else target_object,
                    action_flag=CHANGE,
                    change_message=json.dumps({'action': action, 'payload': payload}),
                    single_object=True
                )
        else:
            # If no object, we still want a record in stdout/logs
            print(f"DEBUG: Internal Audit Log (No DB Object): {log_msg}")
    except Exception as db_err:
        # We NEVER want an audit failure to crash the main order creation
        print(f"WARNING: Audit log to DB failed: {db_err}")
        audit_logger.error(f"Audit DB error: {db_err}")

    return True
