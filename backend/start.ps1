#!/usr/bin/env powershell
# Start script for Sathi Backend (Python 3.14 compatible)

$env:PYTHONPATH = "$PSScriptRoot"

# Check if .env exists
if (-not (Test-Path "$PSScriptRoot\.env")) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..."
    Copy-Item "$PSScriptRoot\.env.example" "$PSScriptRoot\.env"
    Write-Host "📝 Please edit .env with your API keys before restarting."
    exit 1
}

# Run migrations
Write-Host "🔄 Running database migrations..."
python -m alembic upgrade head

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Migration failed. Database may be empty."
}

# Start server
Write-Host "🚀 Starting Sathi Backend on http://localhost:8000"
Write-Host "📚 API docs available at http://localhost:8000/docs"
Write-Host ""

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

