import asyncio
import sys
from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.models.user import User

async def make_user_admin(email: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"User with email {email} not found.")
            return

        print(f"Current role for {email}: {user.system_role}")
        
        user.system_role = "admin"
        await session.commit()
        
        print(f"Successfully updated role for {email} to 'admin'.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/make_user_admin.py <email>")
    else:
        email = sys.argv[1]
        asyncio.run(make_user_admin(email))
