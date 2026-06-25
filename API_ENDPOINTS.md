# API Endpoints Testing Guide

**Base URL**: `http://localhost:8000/api/v1` (Backend)

**Frontend Auth Routes**: `http://localhost:3000/api` (Next.js)

---

## Health & Status

### Health Checks
- **GET** `/` - Root status check
  - Response: `{ status, service, health }`
  
- **GET** `/health` - Full health check
  - Response: `{ status, service, pinecone, redis }`

---

## Authentication

### Auth Routes
- **POST** `/auth/login` - User login
  - Body: `{ email, password }`
  - Response: `{ access_token, refresh_token, token_type, expires_in, user }`

- **POST** `/auth/register` - Register new user
  - Body: `{ email, password, name }`
  - Status: 201
  - Response: `{ access_token, refresh_token, token_type, expires_in, user }`

- **POST** `/auth/google-callback` - Google OAuth callback
  - Body: `{ googleToken }`
  - Response: `{ access_token, refresh_token, token_type, expires_in, user }`

- **POST** `/auth/refresh` - Refresh access token
  - Body: `{ refresh_token }`
  - Response: `{ access_token, refresh_token, token_type, expires_in, user }`

### Frontend Auth Routes
- **POST** `/backend-auth/login` - Login via frontend
- **POST** `/backend-auth/register` - Register via frontend
- **POST** `/backend-auth/logout` - Logout via frontend

---

## User Management

### User Profile
- **GET** `/users/me` - Get current user profile
  - Auth: Required
  - Response: User object with id, email, name, avatar_url, language, etc.

- **PUT** `/users/me` - Update current user profile
  - Auth: Required
  - Body: `{ name?, avatar_url?, language? }`
  - Response: Updated user object

- **PUT** `/users/language` - Update language preference
  - Auth: Required
  - Body: `{ language: "en" | "bn" }`
  - Response: Updated user object

### User Settings
- **GET** `/users/me/settings` - Get user settings
  - Auth: Required
  - Response: `{ id, user_id, settings, created_at, updated_at }`

- **PUT** `/users/me/settings` - Update user settings
  - Auth: Required
  - Body: `{ settings: {...} }`
  - Response: Updated settings object

### User Profile Extended
- **GET** `/users/me/profile` - Get extended profile
  - Auth: Required
  - Response: UserProfile with bio, timezone, phone, gender, wellness_goals, etc.

- **PUT** `/users/me/profile` - Update extended profile
  - Auth: Required
  - Body: `{ bio?, timezone?, phone?, date_of_birth?, gender?, wellness_goals?, preferred_support_style?, emergency_contact_name?, emergency_contact_phone? }`
  - Response: Updated profile object

### Subscription
- **GET** `/users/me/subscription` - Get subscription summary
  - Auth: Required
  - Response: `{ plan, entitlements, metered_usage }`

### Security
- **PUT** `/users/me/password` - Update password
  - Auth: Required
  - Body: `{ current_password, new_password }`
  - Response: `{ message }`
  - Note: Min 8 characters

- **DELETE** `/users/me` - Delete account (soft delete)
  - Auth: Required
  - Body: `{ confirmation: "DELETE", password? }`
  - Status: 204

### Sessions & Export
- **GET** `/users/me/sessions` - Get active sessions
  - Auth: Required
  - Response: List of SessionInfo objects

- **GET** `/users/me/export` - Export user data as JSON
  - Auth: Required
  - Response: JSON file download

---

## Chat

### Conversations
- **GET** `/chat/conversations` - List all conversations
  - Auth: Required
  - Response: List of ConversationSchema objects

- **POST** `/chat/conversations` - Create new conversation
  - Auth: Required
  - Body: `{ title?, language? }`
  - Status: 201
  - Response: ConversationSchema

- **GET** `/chat/conversations/{conversation_id}` - Get conversation details
  - Auth: Required
  - Response: ConversationSchema with messages

- **PUT** `/chat/conversations/{conversation_id}` - Update conversation
  - Auth: Required
  - Body: `{ title? }`
  - Response: Updated ConversationSchema

- **DELETE** `/chat/conversations/{conversation_id}` - Delete conversation
  - Auth: Required
  - Status: 204

### Messages
- **POST** `/chat/send` - Send message to chat
  - Auth: Required
  - Body: `{ conversation_id, message, language? }`
  - Response: ChatResponse with reply and metadata

- **POST** `/chat/stream` - Stream chat response
  - Auth: Required
  - Body: `{ conversation_id, message, language? }`
  - Response: Server-sent events (streaming)

---

## Mood Tracking

### Mood Logs
- **POST** `/mood/log` - Log mood entry
  - Auth: Required
  - Body: `{ mood_level, triggers?, notes?, timestamp? }`
  - Status: 201
  - Response: MoodLogSchema

- **GET** `/mood/logs` - Get mood history
  - Auth: Required
  - Query: `date_from?, date_to?, limit?, offset?`
  - Response: List of MoodLogSchema

### Mood Analytics
- **GET** `/mood/analytics` - Get mood analytics
  - Auth: Required
  - Query: `period?` (daily, weekly, monthly)
  - Response: MoodAnalytics with trends and patterns

### Mood Signals
- **POST** `/mood/reflections` - Log mood reflection
  - Auth: Required
  - Body: `{ reflection, mood_level?, triggers? }`
  - Status: 201
  - Response: MoodReflectionSchema

- **POST** `/mood/activity` - Log app activity event
  - Auth: Required
  - Body: `{ event_type, feature?, duration? }`
  - Status: 201
  - Response: AppActivityEventSchema

- **POST** `/mood/sleep` - Log sleep timing
  - Auth: Required
  - Body: `{ sleep_time, wake_time, quality? }`
  - Status: 201
  - Response: SleepTimingSchema

### Mood Inference
- **GET** `/mood/inference` - Get AI-inferred mood
  - Auth: Required
  - Response: MoodInference with predicted mood and confidence

---

## Journal

### Journal Entries
- **POST** `/journal/entries` - Create journal entry
  - Auth: Required
  - Body: `{ content, title?, tags?, mood?, date? }`
  - Status: 201
  - Response: JournalSchema

- **GET** `/journal/entries` - Get journal entries
  - Auth: Required
  - Query: `date_from?, date_to?, limit?, offset?`
  - Response: List of JournalSchema

- **GET** `/journal/entries/{entry_id}` - Get single entry
  - Auth: Required
  - Response: JournalSchema

- **PUT** `/journal/entries/{entry_id}` - Update entry
  - Auth: Required
  - Body: `{ content?, title?, tags?, mood?, date? }`
  - Response: Updated JournalSchema

- **DELETE** `/journal/entries/{entry_id}` - Delete entry
  - Auth: Required
  - Status: 204

---

## Habits

### Habit Management
- **POST** `/habits/` - Create habit
  - Auth: Required
  - Body: `{ name, description?, frequency, category?, target_days? }`
  - Status: 201
  - Response: HabitSchema

- **GET** `/habits/` - Get all habits
  - Auth: Required
  - Response: List of HabitSchema

- **GET** `/habits/{habit_id}` - Get single habit
  - Auth: Required
  - Response: HabitSchema

- **PUT** `/habits/{habit_id}` - Update habit
  - Auth: Required
  - Body: `{ name?, description?, frequency?, category?, target_days? }`
  - Response: Updated HabitSchema

- **DELETE** `/habits/{habit_id}` - Delete habit
  - Auth: Required
  - Status: 204

### Habit Tracking
- **POST** `/habits/{habit_id}/complete` - Mark habit complete
  - Auth: Required
  - Body: `{ date?, notes? }`
  - Status: 201
  - Response: HabitCompletionSchema

- **GET** `/habits/{habit_id}/completions` - Get completion history
  - Auth: Required
  - Query: `date_from?, date_to?`
  - Response: List of HabitCompletionSchema

- **GET** `/habits/{habit_id}/analytics` - Get habit analytics
  - Auth: Required
  - Response: HabitAnalytics with streak, completion rate, trends

---

## Academic

### Academic Entries
- **POST** `/academic/stress` - Log academic stress
  - Auth: Required
  - Body: `{ level, reason?, timestamp? }`
  - Status: 201
  - Response: AcademicEntry

- **GET** `/academic/stress` - Get stress history
  - Auth: Required
  - Response: List of AcademicEntry

- **POST** `/academic/exam` - Log exam entry
  - Auth: Required
  - Body: `{ subject, date, notes?, stress_level? }`
  - Status: 201
  - Response: AcademicEntry

- **GET** `/academic/exams` - Get exam history
  - Auth: Required
  - Response: List of AcademicEntry

---

## Crisis Support

### Crisis Resources
- **GET** `/crisis/resources` - Get crisis resources (no location)
  - Response: List of CrisisResource objects

- **GET** `/crisis/resources/region/{region}` - Get resources by region
  - Response: List of CrisisResource objects for specific region

---

## Families

### Family Management
- **POST** `/families/create` - Create family group
  - Auth: Required
  - Body: `{ name }`
  - Status: 201
  - Response: Family object

- **POST** `/families/invite` - Invite member to family
  - Auth: Required
  - Body: `{ email, role? }`
  - Response: Invitation object

- **GET** `/families/members` - Get family members
  - Auth: Required
  - Response: List of FamilyMember objects

- **GET** `/families/analytics` - Get family analytics
  - Auth: Required
  - Response: FamilyAnalytics

### Family Activities
- **POST** `/families/activities` - Log family activity
  - Auth: Required
  - Body: `{ activity_type, participants?, notes? }`
  - Status: 201
  - Response: FamilyActivity

---

## Communities

### Community Access
- **GET** `/communities/` - Get all communities
  - Auth: Required
  - Response: List of Community objects

- **POST** `/communities/join` - Join community
  - Auth: Required
  - Body: `{ community_id }`
  - Response: Join confirmation

### Community Posts
- **POST** `/communities/posts` - Create community post
  - Auth: Required
  - Body: `{ community_id, content, title? }`
  - Status: 201
  - Response: CommunityPost

- **GET** `/communities/posts/{community_id}` - Get community posts
  - Auth: Required
  - Response: List of CommunityPost objects

---

## Content Management

### Localized Content
- **GET** `/content/localized` - Get localized content
  - Query: `language?, category?`
  - Response: List of LocalizedContent objects

### Admin Content
- **POST** `/content/admin` - Create content (admin only)
  - Auth: Required (admin)
  - Body: `{ key, en_title, en_content, bn_title, bn_content }`
  - Status: 201
  - Response: LocalizedContent

- **PUT** `/content/admin/{content_id}` - Update content (admin only)
  - Auth: Required (admin)
  - Body: `{ en_title?, en_content?, bn_title?, bn_content? }`
  - Response: Updated LocalizedContent

---

## Subscriptions

### Subscription Requests
- **POST** `/subscription-requests/` - Request subscription
  - Auth: Required
  - Body: `{ reason?, plan? }`
  - Status: 201
  - Response: SubscriptionRequest

- **GET** `/subscription-requests/me` - Get own requests
  - Auth: Required
  - Response: List of SubscriptionRequest objects

---

## Admin Panel

### Admin Overview
- **GET** `/admin/overview` - Get admin dashboard overview
  - Auth: Required (admin)
  - Response: AdminOverview with stats

### User Management (Admin)
- **GET** `/admin/users` - List all users
  - Auth: Required (admin)
  - Query: `limit?, offset?`
  - Response: List of AdminUserSummary

- **PATCH** `/admin/users/{user_id}` - Update user (admin)
  - Auth: Required (admin)
  - Body: `{ is_active?, system_role?, plan? }`
  - Response: Updated AdminUserSummary

### Subscription Requests (Admin)
- **GET** `/admin/subscription-requests` - List subscription requests
  - Auth: Required (admin)
  - Response: List of AdminSubscriptionRequest

- **POST** `/admin/subscription-requests/{request_id}/approve` - Approve request
  - Auth: Required (admin)
  - Response: Updated AdminSubscriptionRequest

- **POST** `/admin/subscription-requests/{request_id}/reject` - Reject request
  - Auth: Required (admin)
  - Response: Updated AdminSubscriptionRequest

### Content Management (Admin)
- **GET** `/admin/content` - List all content
  - Auth: Required (admin)
  - Response: List of AdminLocalizedContent

- **POST** `/admin/content` - Create content
  - Auth: Required (admin)
  - Body: `{ key, en_title, en_content, bn_title, bn_content }`
  - Status: 201

- **PATCH** `/admin/content/{content_id}` - Update content
  - Auth: Required (admin)

- **DELETE** `/admin/content/{content_id}` - Delete content
  - Auth: Required (admin)
  - Status: 204

### Crisis Resources (Admin)
- **GET** `/admin/crisis-resources` - List resources
  - Auth: Required (admin)

- **POST** `/admin/crisis-resources` - Create resource
  - Auth: Required (admin)
  - Status: 201

- **PATCH** `/admin/crisis-resources/{resource_id}` - Update resource
  - Auth: Required (admin)

### Safety Reviews (Admin)
- **GET** `/admin/safety-reviews` - List safety reviews
  - Auth: Required (admin)

- **POST** `/admin/safety-reviews/{message_id}/review` - Review message
  - Auth: Required (admin)
  - Body: `{ is_safe, reason? }`

### Moderation (Admin)
- **GET** `/admin/moderation/community-posts` - List posts for review
  - Auth: Required (admin)

- **POST** `/admin/moderation/community-posts/{post_id}/hide` - Hide post
  - Auth: Required (admin)

- **POST** `/admin/moderation/community-posts/{post_id}/restore` - Restore post
  - Auth: Required (admin)

### Analytics (Admin)
- **GET** `/admin/token-usage` - Get token usage stats
  - Auth: Required (admin)
  - Response: AdminTokenUsage

- **GET** `/admin/analytics` - Get platform analytics
  - Auth: Required (admin)
  - Response: AdminAnalytics

---

## Internationalization (i18n)

### Translations
- **GET** `/i18n/translations` - Get all translations
  - Query: `language?`
  - Response: TranslationResponse with all i18n strings

---

## Offline & SMS

### Offline Sync
- **POST** `/offline/sync` - Sync offline data
  - Auth: Required
  - Body: `{ data: [...] }`
  - Response: Sync confirmation

- **POST** `/offline/sms/checkin` - Check in via SMS
  - Body: `{ phone, message }`

### SMS
- **POST** `/sms/checkin` - SMS check-in
  - Body: `{ phone, message }`

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Successful but no content to return |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Auth required or failed |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Authentication Headers

For authenticated endpoints, include:
```
Authorization: Bearer <access_token>
```

---

## Testing Tools

- **Postman**: Import and test endpoints
- **curl**: Command-line testing
- **Swagger UI**: `http://localhost:8000/docs` (development only)
- **ReDoc**: `http://localhost:8000/redoc` (development only)

---

## Example curl Commands

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Mood Log
```bash
curl -X POST http://localhost:8000/api/v1/mood/log \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mood_level":7,"triggers":["work"],"notes":"Good day"}'
```

### Create Journal Entry
```bash
curl -X POST http://localhost:8000/api/v1/journal/entries \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Day","content":"Reflection...","mood":8}'
```

---

## Rate Limiting

The API implements rate limiting middleware. Check response headers for rate limit info:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Version

- **API Version**: v1
- **Backend Base URL**: `/api/v1`
- **Last Updated**: 2026-05-26
