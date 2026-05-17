"""Supabase client integration for database and auth operations."""
from typing import Optional

try:
    from supabase import create_client, Client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False
    create_client = None
    Client = None

from app.core.config import get_settings

settings = get_settings()

# Global Supabase client
supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """Get Supabase client instance."""
    global supabase_client
    
    if not HAS_SUPABASE:
        print("Supabase client library not installed")
        return None
    
    if supabase_client is None and settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
        try:
            supabase_client = create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=settings.SUPABASE_ANON_KEY
            )
        except Exception as e:
            print(f"Failed to initialize Supabase client: {e}")
            return None
    
    return supabase_client


def get_supabase_service_client() -> Optional[Client]:
    """Get Supabase client with service role key for admin operations."""
    if not HAS_SUPABASE:
        print("Supabase client library not installed")
        return None
        
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
        try:
            return create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY
            )
        except Exception as e:
            print(f"Failed to initialize Supabase service client: {e}")
            return None
    
    return None


def is_supabase_configured() -> bool:
    """Check if Supabase is properly configured."""
    return bool(
        HAS_SUPABASE and
        settings.SUPABASE_URL and 
        settings.SUPABASE_ANON_KEY and
        settings.SUPABASE_JWT_SECRET
    )


def get_supabase_db_url() -> Optional[str]:
    """Construct Supabase database URL from configuration."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_DB_PASSWORD:
        return None
    
    # Extract project reference from Supabase URL
    # Example: https://your-project.supabase.co
    if "supabase.co" in settings.SUPABASE_URL:
        project_ref = settings.SUPABASE_URL.split("//")[1].split(".")[0]
        # Use the explicit URL from env if available, otherwise construct
        if settings.SUPABASE_DB_URL:
            # Convert standard URL to asyncpg format if needed
            if settings.SUPABASE_DB_URL.startswith("postgresql://"):
                return settings.SUPABASE_DB_URL.replace("postgresql://", "postgresql+asyncpg://")
        # Fallback: construct URL using the correct pooler format
        # Format: postgresql+asyncpg://postgres.[PROJECT_REF]:[PASSWORD]@[REGION].pooler.supabase.com:6543/postgres
        return f"postgresql+asyncpg://postgres.{project_ref}:{settings.SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    
    return None


# Initialize Supabase client when module is imported
supabase_client = get_supabase_client()

