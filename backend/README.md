# Sathi Backend

AI Mental Wellness Companion - FastAPI Backend

## Architecture

```
/backend
├── app/
│   ├── api/           # API routes
│   ├── core/          # Config, database, security
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   └── services/      # Business logic
│       ├── ai.py           # OpenAI + Llama 3
│       ├── emotion.py      # HF emotion detection
│       ├── crisis.py       # Crisis detection
│       └── memory.py       # Pinecone vector store
├── alembic/           # Database migrations
├── tests/             # Test suite
└── docker-compose.yml
```

## Tech Stack

- **Framework**: FastAPI + Python 3.12
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0 (async)
- **AI**: OpenAI GPT-4 + HF_API Llama 3
- **Vector DB**: Pinecone
- **Cache**: Cloudflare KV
- **Auth**: Supabase Auth + JWT

## Quick Start

### Python 3.14 Compatibility (No Build Tools Needed)

If you're using Python 3.14, use the SQLite-compatible requirements:

```bash
cd backend
cp .env.example .env
# SQLite is already configured by default for Python 3.14

pip install -r requirements-py314.txt
python -m alembic upgrade head
uvicorn app.main:app --reload
```

### Standard Setup (Python 3.11-3.12)

### 1. Environment Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys
```

### 2. Docker (Recommended)

```bash
docker-compose up -d
```

### 3. Local Development

```bash
# Install Poetry
pip install poetry

# Install dependencies
poetry install

# Run migrations
poetry run alembic upgrade head

# Start server
poetry run uvicorn app.main:app --reload
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/sathi

# Supabase Auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# OpenAI
OPENAI_API_KEY=sk-your-key

# Hugging Face
HF_API_TOKEN=hf-your-token

# Pinecone
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=sathi-memories

# Cloudflare KV
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | User login |
| `/api/v1/auth/register` | POST | User registration |
| `/api/v1/chat/send` | POST | Send message to AI |
| `/api/v1/mood/log` | POST | Log mood entry |
| `/api/v1/journal/entries` | POST | Create journal |
| `/api/v1/habits/` | POST | Create habit |

## Database Schema

### Core Tables
- `users` - User accounts
- `conversations` - Chat sessions
- `messages` - Chat messages
- `mood_logs` - Mood tracking
- `journals` - Journal entries
- `habits` + `habit_completions` - Habit tracking
- `memories` - AI memory references

## AI Features

### Chat
- Multi-provider: OpenAI GPT-4 + HF Llama 3
- Streaming responses
- Emotional context tracking
- Crisis detection

### Emotion Detection
- HF Transformers pipeline
- Categories: sadness, anxiety, stress, loneliness, happiness
- Confidence scoring

### Crisis Detection
- Pattern-based detection
- Severity: low/medium/high
- Safe response templates
- Support resources

### Memory System
- Pinecone vector storage
- Semantic search
- Importance scoring
- Context retrieval

## Development

### Run Tests
```bash
poetry run pytest
```

### Code Formatting
```bash
poetry run black .
poetry run isort .
```

### Migrations
```bash
# Create migration
poetry run alembic revision --autogenerate -m "description"

# Apply migrations
poetry run alembic upgrade head

# Rollback
poetry run alembic downgrade -1
```

## Deployment

### Railway
```bash
railway login
railway link
railway up
```

### Environment
- Set all environment variables in Railway dashboard
- Database: Supabase PostgreSQL
- Vector DB: Pinecone

## License
MIT

