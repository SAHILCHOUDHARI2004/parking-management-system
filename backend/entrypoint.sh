#!/bin/sh
set -e

# Wait for database if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for database to be ready..."
  python -c "
import os, time
db_url = os.getenv('DATABASE_URL')
if '+pg8000' not in db_url and 'postgresql://' in db_url:
    db_url = db_url.replace('postgresql://', 'postgresql+pg8000://', 1)
from sqlalchemy import create_engine
engine = create_engine(db_url)
for i in range(30):
    try:
        connection = engine.connect()
        connection.close()
        print('Database connection successful!')
        break
    except Exception as e:
        print(f'Waiting... {e}')
        time.sleep(1)
else:
    print('Failed to connect to database.')
    exit(1)
"
fi

echo "Running database migrations..."
alembic upgrade head

echo "Starting application server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 5000 --workers 4
