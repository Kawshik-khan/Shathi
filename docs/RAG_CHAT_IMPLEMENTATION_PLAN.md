# RAG Chat Implementation Plan

## Goal

Add a RAG-based Chat Context Engine that helps the chatbot understand how the user is doing without turning the bot into a clinical prediction system. RAG should improve personalization, continuity, and tone adaptation. Mood prediction should stay as a lightweight analytics layer.

## Architecture

The RAG system belongs in the backend service layer:

- `backend/app/services/memory.py`
  - Owns vector retrieval.
  - Uses LangChain + Pinecone when available.
  - Falls back to the existing native Pinecone retrieval.
- `backend/app/services/chat_context.py`
  - Builds one compact private context block for each chat turn.
  - Combines profile preferences, mood trend, journal themes, and relevant memories.
- `backend/app/services/chat.py`
  - Calls the context builder before normal and streaming generation.
  - Passes private context into the AI service.
- `backend/app/services/ai.py`
  - Injects the context into the system prompt as private guidance.
  - Tells the model not to reveal memory retrieval or over-personalize.

## Data Sources

Use existing app data:

- Profile: support style, wellness goals, timezone.
- Mood logs: recent average, trend, stress signal.
- Journals: recent emotion summaries or AI insights only.
- Memories: semantic memories from Pinecone/LangChain.
- Conversation state: active conversation and selected language.

Avoid passing full journal entries or long chat history into RAG context. Use summaries and short snippets only.

## LangChain Setup

Add dependencies:

```txt
langchain>=0.3.0
langchain-openai>=0.2.0
langchain-pinecone>=0.2.0
```

Recommended vector store:

- Pinecone remains the vector DB.
- OpenAI `text-embedding-3-small` remains the default embedding model.
- LangChain should wrap retrieval only; do not introduce LangChain agents yet.

## Runtime Flow

1. User sends a chat message.
2. Crisis detection still runs first and remains the hard safety path.
3. Chat service loads recent conversation messages.
4. Chat Context Engine builds a compact context:
   - retrieve top 3 memories
   - summarize recent mood trend
   - include profile support style
   - include recent journal themes
5. AI service receives:
   - natural Bengali style prompt
   - dialogue mode
   - private context block
   - recent conversation history
6. Model responds naturally.
7. Anti-repetition middleware still rewrites therapy-loop outputs.

## Prompt Safety Rules

The private context must be used quietly:

- Do not say `I remember`.
- Do not mention journal, mood, or memory unless the user asks.
- Do not make medical claims.
- Do not over-personalize.
- Use context only when it makes the reply more helpful or natural.

## Prediction Rules

Use simple rules first:

- Recent mood low or trending down: gentle support.
- Recent stress high: calm and practical reply.
- Recent mood improving: upbeat energy is okay.
- No useful data: normal casual tone.

Do not present these as diagnoses.

## Tests

Core tests:

- Context builder returns empty-safe context when no user data exists.
- Context builder limits output length.
- Mood trend maps to the expected prediction.
- Private context is added to the AI system prompt.
- Streaming and non-streaming chat pass the same context.
- LangChain missing from environment does not break imports.
- Existing crisis flow still bypasses normal RAG generation.

## Rollout

Start with backend-only RAG context. Do not add frontend UI until the quality is proven. Later, add profile settings to let users enable/disable memory personalization.
