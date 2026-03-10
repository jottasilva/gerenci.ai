#!/bin/sh
set -e

echo "Waiting for postgres..."
while ! nc -z gerenciai-postgres 5432; do
  sleep 1
done
echo "PostgreSQL started"

python manage.py migrate --noinput
python manage.py collectstatic --noinput

gunicorn core.wsgi:application --bind 0.0.0.0:9999 --workers 3
