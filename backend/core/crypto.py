"""
LGPD — Criptografia de campos sensíveis (AES-256 via Fernet)
Utiliza ENCRYPTION_KEY de settings.py para cifrar/decifrar dados em repouso.
"""
from cryptography.fernet import Fernet
from django.conf import settings
import base64
import hashlib


def _get_fernet_key():
    """Deriva uma chave Fernet de 32 bytes a partir de ENCRYPTION_KEY."""
    raw_key = getattr(settings, 'ENCRYPTION_KEY', 'INSECURE-dev-fallback')
    digest = hashlib.sha256(raw_key.encode('utf-8')).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_value(plaintext: str) -> str:
    """Criptografa uma string. Retorna string vazia se input vazio."""
    if not plaintext:
        return plaintext
    f = Fernet(_get_fernet_key())
    return f.encrypt(plaintext.encode('utf-8')).decode('utf-8')


def decrypt_value(ciphertext: str) -> str:
    """Descriptografa uma string cifrada. Retorna string vazia se input vazio."""
    if not ciphertext:
        return ciphertext
    try:
        f = Fernet(_get_fernet_key())
        return f.decrypt(ciphertext.encode('utf-8')).decode('utf-8')
    except Exception:
        # Se não conseguir descriptografar, retorna o valor original
        # (pode acontecer com dados migrados pré-criptografia)
        return ciphertext
