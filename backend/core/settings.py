import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
from corsheaders.defaults import default_headers

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


# ─────────────────────────────────────────────────────────
# SECURITY (LGPD Art. 46)
# ─────────────────────────────────────────────────────────
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "INSECURE-dev-only-change-in-production"
)

DEBUG = os.environ.get("DJANGO_DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get(
        "DJANGO_ALLOWED_HOSTS",
        "localhost,127.0.0.1"
    ).split(",")
    if host.strip()
]

ENCRYPTION_KEY = os.environ.get(
    "ENCRYPTION_KEY",
    "INSECURE-dev-only-change-in-production"
)


# ─────────────────────────────────────────────────────────
# CSRF TRUSTED ORIGINS
# ─────────────────────────────────────────────────────────
CSRF_TRUSTED_ORIGINS = [
    "https://gerencia.ogerente.site",
    "https://www.gerencia.ogerente.site",
    "https://gerenciadmin.ogerente.site",
]


# ─────────────────────────────────────────────────────────
# APPLICATIONS
# ─────────────────────────────────────────────────────────
INSTALLED_APPS = [
    "unfold",

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third Party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",

    # Local Apps
    "core",
    "accounts",
    "stores",
    "products",
    "orders",
    "customers",
    "billing",
    "suppliers",
]


# ─────────────────────────────────────────────────────────
# MIDDLEWARE
# ─────────────────────────────────────────────────────────
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "core.urls"


# ─────────────────────────────────────────────────────────
# TEMPLATES
# ─────────────────────────────────────────────────────────
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


WSGI_APPLICATION = "core.wsgi.application"


# ─────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# ─────────────────────────────────────────────────────────
# AUTH USER
# ─────────────────────────────────────────────────────────
AUTH_USER_MODEL = "accounts.User"


# ─────────────────────────────────────────────────────────
# PASSWORD VALIDATORS
# ─────────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ─────────────────────────────────────────────────────────
# LOCALIZATION
# ─────────────────────────────────────────────────────────
LANGUAGE_CODE = "pt-br"

TIME_ZONE = "America/Sao_Paulo"

USE_I18N = True
USE_TZ = True


# ─────────────────────────────────────────────────────────
# STATIC / MEDIA
# ─────────────────────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ─────────────────────────────────────────────────────────
# UNFOLD ADMIN
# ─────────────────────────────────────────────────────────
UNFOLD = {
    "SITE_TITLE": "Gerenci.AI",
    "SITE_HEADER": "Gerenci.AI Admin",
    "SITE_SYMBOL": "dashboard",

    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": False,

    "THEME": "dark",
}


# ─────────────────────────────────────────────────────────
# DRF
# ─────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}


# ─────────────────────────────────────────────────────────
# JWT
# ─────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),

    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,

    "AUTH_HEADER_TYPES": ("Bearer",),

    "USER_ID_FIELD": "whatsapp",
}


# ─────────────────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = os.environ.get(
    "CORS_ALLOW_CREDENTIALS",
    "False"
).lower() == "true"

CORS_ALLOW_HEADERS = list(default_headers) + [
    "x-store-id",
]


# ─────────────────────────────────────────────────────────
# SECURITY HEADERS
# ─────────────────────────────────────────────────────────
X_FRAME_OPTIONS = "DENY"

SECURE_BROWSER_XSS_FILTER = True

SECURE_CONTENT_TYPE_NOSNIFF = True


# ─────────────────────────────────────────────────────────
# PRODUCTION SECURITY
# ─────────────────────────────────────────────────────────
if not DEBUG:

    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

    USE_X_FORWARDED_HOST = True

    SECURE_SSL_REDIRECT = True

    SESSION_COOKIE_SECURE = True

    CSRF_COOKIE_SECURE = True

    SECURE_HSTS_SECONDS = 31536000

    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

    SECURE_HSTS_PRELOAD = True
