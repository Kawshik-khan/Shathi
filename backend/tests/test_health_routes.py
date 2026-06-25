import asyncio

from app.main import app


def test_root_status_route():
    route = next(route for route in app.routes if getattr(route, "path", None) == "/")

    assert asyncio.run(route.endpoint()) == {
        "status": "ok",
        "service": "shathi-api",
        "health": "/health",
    }


def test_health_route():
    route = next(route for route in app.routes if getattr(route, "path", None) == "/health")

    response = asyncio.run(route.endpoint())
    assert response["status"] == "healthy"
    assert response["service"] == "shathi-api"
    assert response["pinecone"] in {"connected", "unavailable"}
    assert response["redis"] in {"connected", "unavailable"}
