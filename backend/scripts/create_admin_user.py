import asyncio
import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from sqlalchemy.orm import raiseload

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.services.auth import normalize_email


async def create_admin_user() -> None:
    email = normalize_email(os.environ["ADMIN_EMAIL"])
    password = os.environ["ADMIN_PASSWORD"]

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).options(raiseload("*")).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if user is None:
            user = User(
                email=email,
                name="Admin",
                hashed_password=get_password_hash(password),
                system_role="admin",
                plan="premium",
                subscription_status="active",
                is_active=True,
            )
            session.add(user)
            action = "created"
        else:
            user.name = user.name or "Admin"
            user.hashed_password = get_password_hash(password)
            user.system_role = "admin"
            user.is_active = True
            action = "updated"

        await session.commit()
        await session.refresh(user)
        print(
            f"Admin user {action}: "
            f"email={user.email}, id={user.id}, role={user.system_role}, active={user.is_active}"
        )


if __name__ == "__main__":
    asyncio.run(create_admin_user())