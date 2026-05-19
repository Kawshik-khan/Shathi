import asyncio

from app.services.crisis import (
    CrisisSeverity,
    detect_crisis,
    filter_unsafe_assistant_response,
)


def test_detect_crisis_prioritizes_high_severity():
    result = asyncio.run(detect_crisis("I have no hope and want to kill myself"))

    assert result.is_crisis is True
    assert result.severity == CrisisSeverity.HIGH
    assert result.category == "suicide"
    assert "988" in result.response_template


def test_filter_unsafe_assistant_response_replaces_bad_content():
    unsafe, response = filter_unsafe_assistant_response("You should kill yourself.")

    assert unsafe is True
    assert "Crisis" in response or "988" in response


def test_filter_unsafe_assistant_response_allows_safe_content():
    unsafe, response = filter_unsafe_assistant_response("Please reach out to someone you trust.")

    assert unsafe is False
    assert response == "Please reach out to someone you trust."
