#!/bin/bash
set -e

echo "Waiting for database to be ready..."
until dotnet ef database update --project /src/src/FluxPay.Infrastructure --startup-project /src/src/FluxPay.Api --no-build 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is up - executing migrations"
dotnet ef database update --project /src/src/FluxPay.Infrastructure --startup-project /src/src/FluxPay.Api --no-build

echo "Starting application..."
exec dotnet FluxPay.Api.dll
