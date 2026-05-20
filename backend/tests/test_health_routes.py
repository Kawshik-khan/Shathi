import asyncio

from app.main import app


def test_root_status_route():
    route = next(route for route in app.routes if getattr(route, "path", None) == "/")

    assert asyncio.run(route.endpoint()) == {
        "status": "ok",
        "service": "sathi-api",
        "health": "/health",
    }


def test_health_route():
    route = next(route for route in app.routes if getattr(route, "path", None) == "/health")

    assert asyncio.run(route.endpoint()) == {"status": "healthy", "service": "sathi-api"}
