#!/bin/sh
set -e

echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until python -c "
import socket
s = socket.socket()
s.settimeout(1)
try:
    s.connect(('${DB_HOST:-db}', int('${DB_PORT:-5432}')))
    s.close()
    exit(0)
except Exception:
    exit(1)
"; do
    echo "  DB not ready yet, retrying in 1s..."
    sleep 1
done
echo "PostgreSQL is up."

python manage.py makemigrations releves --noinput
python manage.py migrate --noinput
python manage.py create_first_admin

exec "$@"
