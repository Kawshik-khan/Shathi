import asyncio
import logging
from app.core.database import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import select

# Suppress SQLAlchemy logging
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        for user in users:
            print(f"Email: {user.email}, Role: {user.system_role}")

if __name__ == "__main__":
    asyncio.run(main())
