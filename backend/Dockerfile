FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  libpq-dev \
  libjpeg-dev \
  zlib1g-dev \
  libwebp-dev \
  libpng-dev \
  netcat-traditional \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn psycopg2-binary

COPY . .

RUN mkdir -p /app/static /app/media

COPY <<EOF /start.sh
#!/bin/sh
set -e

echo "Waiting for postgres..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

python manage.py migrate --noinput
python manage.py collectstatic --noinput

gunicorn core.wsgi:application --bind 0.0.0.0:9999 --workers 3
EOF

RUN chmod +x /start.sh

EXPOSE 9999

ENTRYPOINT ["/start.sh"]
