"""User API routes."""
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.localization import LanguagePreferenceUpdate
from app.schemas.user import (
    AccountDeleteRequest,
    PasswordUpdate,
    SessionInfo,
    User,
    UserProfile,
    UserProfileUpdate,
    UserSettings,
    UserSettingsPayload,
    UserUpdate,
)
from app.services.user import (
    deactivate_user,
    export_user_data,
    get_or_create_user_profile,
    get_or_create_user_settings,
    update_user,
    update_user_profile,
    update_user_password,
    update_user_settings,
)
from app.models.user import User as UserModel

router = APIRouter()


def profile_response(user: UserModel, profile) -> UserProfile:
    """Build a flattened profile response."""
    return UserProfile(
        id=profile.id,
        user_id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        language=user.language,
        bio=profile.bio,
        timezone=profile.timezone,
        phone=profile.phone,
        date_of_birth=profile.date_of_birth,
        gender=profile.gender,
        wellness_goals=profile.wellness_goals or {},
        preferred_support_style=profile.preferred_support_style,
        emergency_contact_name=profile.emergency_contact_name,
        emergency_contact_phone=profile.emergency_contact_phone,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.get("/me", response_model=User)
async def get_current_user(
    current_user: UserModel = Depends(get_current_active_user),
) -> User:
    """Get current user profile."""
    return User(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
        language=current_user.language,
        family_id=current_user.family_id,
        is_active=current_user.is_active,
        supabase_uid=current_user.supabase_uid,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )


@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user: UserModel = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update current user profile."""
    updated_user = await update_user(db, current_user.id, user_update)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return User(
        id=updated_user.id,
        email=updated_user.email,
        name=updated_user.name,
        avatar_url=updated_user.avatar_url,
        language=updated_user.language,
        family_id=updated_user.family_id,
        is_active=updated_user.is_active,
        supabase_uid=updated_user.supabase_uid,
        created_at=updated_user.created_at,
        updated_at=updated_user.updated_at,
    )


@router.put("/language", response_model=User)
async def update_language_preference(
    language_update: LanguagePreferenceUpdate,
    current_user: UserModel = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update current user's language preference."""
    if language_update.language not in {"en", "bn"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported language",
        )

    updated_user = await update_user(
        db,
        current_user.id,
        UserUpdate(language=language_update.language),
    )

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return User(
        id=updated_user.id,
        email=updated_user.email,
        name=updated_user.name,
        avatar_url=updated_user.avatar_url,
        language=updated_user.language,
        family_id=updated_user.family_id,
        is_active=updated_user.is_active,
        supabase_uid=updated_user.supabase_uid,
        created_at=updated_user.created_at,
        updated_at=updated_user.updated_at,
    )


@router.get("/me/profile", response_model=UserProfile)
async def get_current_user_profile(
    current_user: UserModel = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfile:
    """Get current user's extended profile."""
    profile = await get_or_create_user_profile(db, current_user)
    return profile_response(current_user, profile)


@router.put("/me/profile", response_model=UserProfile)
async def update_current_user_profile(
    payload: UserProfileUpdate,
    current_user: UserModel = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfile:
    """Update current user's extended profile."""
    if payload.language is not None and payload.language not in {"en", "bn"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported language",
        )

    updated_user, profile = await update_user_profile(db, current_user, payload)
    return profile_response(updated_user, profile)


@router.get("/me/settings", response_model=UserSettings)
async def get_current_user_settings(
    current_user: UserModel = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserSettings:
    """Get current user's persisted settings."""
    settings = await get_or_create_user_settings(db, current_user)
    return UserSettings(
        id=settings.id,
        user_id=settings.user_id,
        settings=settings.settings,
        created_at=settings.created_at,
        updated_at=settings.updated_at,
    )


@router.put("/me/settings", response_model=UserSettings)
async def update_current_user_settings(
    payload: UserSettingsPayload,
    current_user: UserModel = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserSettings:
    """Update current user's persisted settings."""
    settings = await update_user_settings(db, current_user, payload.settings)
    return UserSettings(
        id=settings.id,
        user_id=settings.user_id,
        settings=settings.settings,
        created_at=settings.created_at,
        updated_at=settings.updated_at,
    )


@router.get("/me/export")
async def export_current_user_data(
    current_user: UserModel = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Export current user's data as JSON."""
    data = await export_user_data(db, current_user)
    import json

    return Response(
        content=json.dumps(data, ensure_ascii=False, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="sathi-data-export.json"'},
    )


@router.put("/me/password")
async def update_current_user_password(
    payload: PasswordUpdate,
    current_user: UserModel = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Update current user's password."""
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters",
        )

    updated = await update_user_password(
        db,
        current_user,
        payload.current_password,
        payload.new_password,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    return {"message": "Password updated"}


@router.get("/me/sessions", response_model=list[SessionInfo])
async def get_current_user_sessions(
    current_user: UserModel = Depends(get_current_active_user),
) -> list[SessionInfo]:
    """Return active session metadata for the custom JWT auth model."""
    return [
        SessionInfo(
            id=f"current-{current_user.id}",
            current=True,
            note="Custom JWT sessions are stateless; sign out on this device to clear the local token.",
        )
    ]


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user_account(
    payload: AccountDeleteRequest,
    current_user: UserModel = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Soft-delete current user's account."""
    if payload.confirmation != "DELETE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Type "DELETE" to confirm account deletion',
        )

    if current_user.hashed_password and payload.password:
        from app.core.security import verify_password

        if not verify_password(payload.password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is incorrect",
            )

    deleted = await deactivate_user(db, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

