import asyncio
import httpx
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash

BASE_URL = "http://localhost:8000/api/v1"

async def setup_test_admin():
    email = "k@gmail.com"
    password = "testpassword"
    
    # Update admin password
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one()
        user.hashed_password = get_password_hash(password)
        await session.commit()
        print(f"Updated password for {email}")
            
    # Login
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": password
        })
        if resp.status_code != 200:
            print(f"Failed to login: {resp.text}")
            return None
        token = resp.json()["access_token"]
        return token

async def test_endpoints(token):
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        endpoints = [
            "/admin/overview",
            "/admin/users",
            "/admin/subscription-requests",
            "/admin/content",
            "/admin/crisis-resources",
            "/admin/safety-reviews",
            "/admin/moderation/community-posts",
            "/admin/token-usage"
        ]
        
        for endpoint in endpoints:
            try:
                resp = await client.get(f"{BASE_URL}{endpoint}", headers=headers)
                print(f"{endpoint}: {resp.status_code}")
                if resp.status_code != 200:
                    print(f"  Response: {resp.text}")
            except Exception as e:
                print(f"{endpoint}: Failed with {e}")

async def main():
    token = await setup_test_admin()
    if token:
        await test_endpoints(token)

if __name__ == "__main__":
    asyncio.run(main())
