from app.core.config import ENV_FILE
print(f"ENV_FILE: {ENV_FILE}")
print(f"Exists: {ENV_FILE.exists()}")
from app.core.config import get_settings
settings = get_settings()
print(f"SUPABASE_DB_URL: {settings.SUPABASE_DB_URL}")
