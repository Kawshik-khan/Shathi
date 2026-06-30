"""User service for database operations."""
from datetime import date, datetime
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.models.conversation import Conversation, Message
from app.models.habit import Habit, HabitCompletion
from app.models.journal import Journal
from app.models.mood import MoodLog
from app.models.profile import UserProfile
from app.models.settings import UserSettings
from app.models.user import User
from app.schemas.user import UserProfileUpdate, UserUpdate


DEFAULT_SETTINGS: dict[str, Any] = {
    "displayName": "",
    "email": "",
    "timezone": "Asia/Dhaka",
    "bio": "",
    "personalityMode": "calm_therapist",
    "responseLength": 60,
    "emotionalWarmth": 60,
    "conversationDepth": 70,
    "motivationalTone": 50,
    "theme": "adaptive",
    "accentColor": "#22C55E",
    "fontSize": 16,
    "motionEnabled": True,
    "sleepGoal": 8,
    "hydrationReminders": True,
    "mindfulnessGoal": True,
    "workoutGoal": 3,
    "journalingFrequency": "daily",
    "emotionalCheckIns": True,
    "reminderFrequency": "medium",
    "bedtimeReminders": True,
    "journalingPrompts": True,
    "motivationalNudges": False,
    "aiMemoryEnabled": True,
    "dataExportSchedule": "monthly",
    "connectedApps": {
        "appleHealth": False,
        "googleFit": False,
        "fitbit": False,
        "notion": False,
    },
    "memoryRetention": 50,
    "emotionalMemory": True,
    "longTermPersonalization": True,
    "twoFactorEnabled": False,
    "biometricLogin": False,
}

DEFAULT_PROFILE: dict[str, Any] = {
    "bio": None,
    "timezone": "Asia/Dhaka",
    "phone": None,
    "date_of_birth": None,
    "gender": None,
    "wellness_goals": {},
    "preferred_support_style": None,
    "emergency_contact_name": None,
    "emergency_contact_phone": None,
}


def _json_value(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def _model_to_dict(model: Any, fields: list[str]) -> dict[str, Any]:
    return {field: _json_value(getattr(model, field)) for field in fields}


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    """Get user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Get user by email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def update_user(
    db: AsyncSession, 
    user_id: str, 
    user_update: UserUpdate
) -> User | None:
    """Update user profile."""
    # Build update dict with only provided fields
    update_data = {}
    if user_update.name is not None:
        update_data["name"] = user_update.name
    if user_update.avatar_url is not None:
        update_data["avatar_url"] = user_update.avatar_url
    if user_update.language is not None:
        update_data["language"] = user_update.language
    
    if not update_data:
        # No changes requested
        return await get_user_by_id(db, user_id)
    
    # Update user
    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(**update_data)
        .returning(User)
    )
    
    result = await db.execute(stmt)
    await db.commit()
    
    return result.scalar_one_or_none()


async def get_or_create_user_profile(db: AsyncSession, user: User) -> UserProfile:
    """Get extended profile for a user, creating defaults when missing."""
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()

    if profile:
        return profile

    profile = UserProfile(
        user_id=user.id,
        **DEFAULT_PROFILE,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


async def update_user_profile(
    db: AsyncSession,
    user: User,
    profile_update: UserProfileUpdate,
) -> tuple[User, UserProfile]:
    """Update account basics and extended profile fields."""
    user_update = UserUpdate(
        name=profile_update.name,
        avatar_url=profile_update.avatar_url,
        language=profile_update.language,
    )
    updated_user = await update_user(db, user.id, user_update)
    if not updated_user:
        updated_user = user

    profile = await get_or_create_user_profile(db, updated_user)
    update_data = profile_update.model_dump(exclude_unset=True)

    for field in ("name", "avatar_url", "language"):
        update_data.pop(field, None)

    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    await db.refresh(updated_user)
    return updated_user, profile


async def get_or_create_user_settings(db: AsyncSession, user: User) -> UserSettings:
    """Get settings for a user, creating defaults when missing."""
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user.id))
    settings = result.scalar_one_or_none()

    if settings:
        merged = {
            **DEFAULT_SETTINGS,
            "displayName": user.name,
            "email": user.email,
            **(settings.settings or {}),
        }
        if merged != settings.settings:
            settings.settings = merged
            await db.commit()
            await db.refresh(settings)
        return settings

    settings = UserSettings(
        user_id=user.id,
        settings={
            **DEFAULT_SETTINGS,
            "displayName": user.name,
            "email": user.email,
        },
    )
    db.add(settings)
    await db.commit()
    await db.refresh(settings)
    return settings


async def update_user_settings(
    db: AsyncSession,
    user: User,
    next_settings: dict[str, Any],
) -> UserSettings:
    """Merge and persist settings."""
    settings = await get_or_create_user_settings(db, user)
    settings.settings = {
        **DEFAULT_SETTINGS,
        "displayName": user.name,
        "email": user.email,
        **(settings.settings or {}),
        **next_settings,
    }
    await db.commit()
    await db.refresh(settings)
    return settings


async def update_user_password(
    db: AsyncSession,
    user: User,
    current_password: str,
    new_password: str,
) -> bool:
    """Update a user's password after validating the current password.

    Bumps ``token_version`` so every outstanding access *and* refresh
    token for this user is invalidated (P1 1.2). The user must log in
    again on every device — exactly the desired behavior after a
    credential change.
    """
    if not user.hashed_password or not verify_password(current_password, user.hashed_password):
        return False

    user.hashed_password = get_password_hash(new_password)
    user.token_version = int(getattr(user, "token_version", 0) or 0) + 1
    await db.commit()
    return True


async def export_user_data(db: AsyncSession, user: User) -> dict[str, Any]:
    """Return a JSON-serializable export of user-owned data."""
    settings = await get_or_create_user_settings(db, user)
    profile = await get_or_create_user_profile(db, user)

    mood_logs = (await db.execute(select(MoodLog).where(MoodLog.user_id == user.id))).scalars().all()
    journals = (await db.execute(select(Journal).where(Journal.user_id == user.id))).scalars().all()
    habits = (await db.execute(select(Habit).where(Habit.user_id == user.id))).scalars().all()
    conversations = (await db.execute(select(Conversation).where(Conversation.user_id == user.id))).scalars().all()
    conversation_ids = [conversation.id for conversation in conversations]
    messages = []
    if conversation_ids:
        messages = (
            await db.execute(select(Message).where(Message.conversation_id.in_(conversation_ids)))
        ).scalars().all()

    habit_ids = [habit.id for habit in habits]
    completions = []
    if habit_ids:
        completions = (
            await db.execute(select(HabitCompletion).where(HabitCompletion.habit_id.in_(habit_ids)))
        ).scalars().all()

    return {
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "user": _model_to_dict(
            user,
            [
                "id",
                "email",
                "name",
                "avatar_url",
                "language",
                "system_role",
                "plan",
                "subscription_status",
                "subscription_started_at",
                "subscription_ends_at",
                "family_id",
                "family_role",
                "is_active",
                "created_at",
                "updated_at",
            ],
        ),
        "settings": settings.settings,
        "profile": _model_to_dict(
            profile,
            [
                "id",
                "bio",
                "timezone",
                "phone",
                "date_of_birth",
                "gender",
                "wellness_goals",
                "preferred_support_style",
                "emergency_contact_name",
                "emergency_contact_phone",
                "created_at",
                "updated_at",
            ],
        ),
        "mood_logs": [
            _model_to_dict(log, ["id", "mood", "stress", "energy", "sleep", "note", "logged_at", "created_at"])
            for log in mood_logs
        ],
        "journal_entries": [
            _model_to_dict(entry, ["id", "title", "content", "written_at", "created_at", "updated_at"])
            for entry in journals
        ],
        "habits": [
            _model_to_dict(
                habit,
                ["id", "name", "description", "icon", "color", "frequency", "target_count", "current_streak", "longest_streak", "total_completions", "is_active", "created_at", "updated_at"],
            )
            for habit in habits
        ],
        "habit_completions": [
            _model_to_dict(completion, ["id", "habit_id", "completed_at", "count", "note", "created_at"])
            for completion in completions
        ],
        "conversations": [
            _model_to_dict(conversation, ["id", "title", "summary", "emotion_context", "created_at", "updated_at"])
            for conversation in conversations
        ],
        "messages": [
            _model_to_dict(message, ["id", "conversation_id", "role", "content", "emotion", "crisis_flag", "crisis_severity", "created_at"])
            for message in messages
        ],
    }


async def deactivate_user(db: AsyncSession, user_id: str) -> bool:
    """Deactivate user account."""
    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(is_active=False)
    )
    
    result = await db.execute(stmt)
    await db.commit()
    
    return result.rowcount > 0


async def activate_user(db: AsyncSession, user_id: str) -> bool:
    """Activate user account."""
    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(is_active=True)
    )
    
    result = await db.execute(stmt)
    await db.commit()
    
    return result.rowcount > 0

