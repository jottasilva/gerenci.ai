# Use Python 3.11 slim as base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set working directory
WORKDIR /app

# Install system dependencies
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

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn psycopg2-binary

# Copy backend source code
COPY . .

# Create directory for static and media files
RUN mkdir -p /app/static /app/media

# Add a script to run migrations and start the server
COPY <<EOF /start.sh
#!/bin/bash
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

# Expose port
EXPOSE 9999

# Set entrypoint
ENTRYPOINT ["/start.sh"]
