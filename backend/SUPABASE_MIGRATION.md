# Supabase Migration Guide

This guide helps you migrate the Sathi backend from local SQLite to Supabase PostgreSQL database.

## 🚀 Quick Setup

### 1. Get Supabase Credentials
1. Go to [supabase.com](https://supabase.com)
2. Create a new project or use existing one
3. Navigate to Project Settings > API
4. Copy the following:
   - Project URL
   - Anon Public Key
   - Service Role Key
   - JWT Secret

### 2. Database Credentials
1. In Supabase, go to Project Settings > Database
2. Scroll down to "Connection string"
3. Copy the URI or use these components:
   - Password (found under "Database password")
   - Connection parameters

### 3. Update Environment Variables
Copy `.env.example` to `.env` and update:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
SUPABASE_DB_PASSWORD=your-supabase-db-password

# Alternative: Direct database URL
SUPABASE_DB_URL=postgresql+asyncpg://postgres.your-project:your-db-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## 🔧 Configuration Options

### Option A: Automatic Database URL (Recommended)
The system will automatically construct the Supabase database URL from your project URL and password.

### Option B: Manual Database URL
Set `SUPABASE_DB_URL` directly if you prefer manual configuration.

### Option C: Local Development
Keep using SQLite by not setting Supabase variables or setting `DATABASE_URL=sqlite+aiosqlite:///./sathi.db`.

## 🧪 Database Migration

### 1. Test Connection
```bash
python test_supabase_connection.py
```

### 2. Apply Migrations
```bash
# First, install alembic if not already installed
pip install alembic

# Run migrations
alembic upgrade head
```

### 3. Verify Tables
Connect to your Supabase dashboard and verify all tables are created:
- users
- conversations
- messages
- mood_logs
- journals
- habits
- habit_completions
- memories

## 🔒 Security Considerations

1. **Never commit actual credentials** to version control
2. **Use service role key** for admin operations
3. **Keep JWT secret** secure and private
4. **Use environment-specific** keys for development vs production

## 🌍 Environment Variables

### Development
```bash
APP_ENV=development
DEBUG=true
DATABASE_URL=sqlite+aiosqlite:///./sathi.db
```

### Production
```bash
APP_ENV=production
DEBUG=false
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_DB_PASSWORD=your-db-password
```

## 🔄 Fallback Behavior

The application will:
1. Try Supabase if configured
2. Fall back to SQLite if Supabase fails
3. Use local database if no Supabase config exists

## 🧪 Testing

### Test Database Connection
```bash
python test_supabase_connection.py
```

### Test API Endpoints
```bash
uvicorn app.main:app --reload
```

### Test with curl
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test user registration
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "name": "Test User"}'
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check Supabase project URL format
   - Verify database password
   - Ensure network connectivity

2. **Migration Errors**
   - Run `alembic upgrade head` with `--sql` flag to see SQL
   - Check Supabase database permissions
   - Verify database URL format

3. **Authentication Issues**
   - Verify JWT secret format
   - Check service role key permissions
   - Ensure proper CORS origins

### Debug Mode
Enable debug logging:
```bash
DEBUG=true uvicorn app.main:app --reload
```

## 📊 Monitoring

Monitor your Supabase dashboard for:
- Database connections
- Query performance
- Storage usage
- API rate limits

## 🎯 Next Steps

1. Configure environment variables
2. Test database connection
3. Apply migrations
4. Start the application
5. Verify all API endpoints work

Your Sathi backend is now ready for production with Supabase! 🎉

