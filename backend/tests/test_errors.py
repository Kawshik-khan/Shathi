from app.core.errors import error_response


def test_error_response_shape():
    response = error_response(429, "Too many requests", "RATE_LIMITED")

    assert response.status_code == 429
    assert b"RATE_LIMITED" in response.body
    assert b"Too many requests" in response.body
