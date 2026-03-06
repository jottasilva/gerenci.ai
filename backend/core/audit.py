"""
LGPD — Expansão do sistema de auditoria com sanitização de dados pessoais.
"""
import logging
import re
import json
from django.contrib.admin.models import LogEntry, CHANGE
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

# Specialized logger for audit trail
audit_logger = logging.getLogger('audit_trail')


def sanitize_for_log(text: str) -> str:
    """
    Remove/mascara dados pessoais de strings antes de logar.
    LGPD Art. 46 — pseudonimização em logs.
    """
    if not text:
        return text
    text = str(text)
    # Telefone (BR): (XX) XXXXX-XXXX ou variantes
    text = re.sub(r'\b\d{2}[\s.-]?\d{4,5}[\s.-]?\d{4}\b', '[PHONE]', text)
    # CPF: XXX.XXX.XXX-XX
    text = re.sub(r'\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b', '[CPF]', text)
    # CNPJ: XX.XXX.XXX/XXXX-XX
    text = re.sub(r'\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b', '[CNPJ]', text)
    # Email
    text = re.sub(r'[\w.+-]+@[\w-]+\.[\w.]+', '[EMAIL]', text)
    return text


def log_data_access(request, action, resource_type, resource_id='', details=None, user=None):
    """
    Registra acesso a dados pessoais no DataAccessLog.
    Usar em views que manipulam dados de Customer, User, etc.
    """
    try:
        from core.models import DataAccessLog
        DataAccessLog.objects.create(
            user=user or (request.user if request.user.is_authenticated else None),
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            ip_address=_get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            details=details or {},
        )
    except Exception as e:
        audit_logger.error(f"Failed to log data access: {e}")


def _get_client_ip(request):
    """Extrai IP do cliente, considerando proxies."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_critical_action(user, action, target_object=None, reason=None, payload=None):
    """
    Utility to record critical business actions.
    Uses Django Admin Log as a base (schema-preserving) and an external logger.
    Agora com sanitização de dados pessoais nos logs.
    """
    timestamp = timezone.now()

    # Sanitizar dados antes de logar
    safe_reason = sanitize_for_log(reason) if reason else reason
    safe_payload = sanitize_for_log(str(payload)) if payload else payload
    user_id = getattr(user, 'whatsapp', getattr(user, 'pk', 'unknown'))

    log_msg = f"AUDIT | {timestamp} | User: {user_id} | Action: {action} | Reason: {safe_reason} | Payload: {safe_payload}"

    # 1. Log to Python logging (dedicated file/stream)
    audit_logger.info(log_msg)

    # 2. Log to Django Admin Log (Database)
    try:
        if target_object:
            content_type = ContentType.objects.get_for_model(target_object)

            if hasattr(LogEntry.objects, 'log_action'):
                LogEntry.objects.log_action(
                    user_id=user.pk,
                    content_type_id=content_type.pk,
                    object_id=target_object.pk,
                    object_repr=sanitize_for_log(str(target_object)),
                    action_flag=CHANGE,
                    change_message=json.dumps({
                        'action': action,
                        'reason': safe_reason,
                        'payload': safe_payload,
                        'timestamp': str(timestamp)
                    })
                )
        else:
            audit_logger.info(f"Internal Audit (No DB Object): {log_msg}")
    except Exception as db_err:
        # NEVER let audit failure crash the main operation
        audit_logger.error(f"Audit DB error: {db_err}")

    return True
