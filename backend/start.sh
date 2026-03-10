#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

gunicorn core.wsgi:application --bind 0.0.0.0:9999 --workers 3
