from app.core.config import get_settings
settings = get_settings()
print(f"SUPABASE_DB_URL: {settings.SUPABASE_DB_URL}")
print(f"DATABASE_URL: {settings.DATABASE_URL}")
