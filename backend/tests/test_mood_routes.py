from datetime import datetime, timezone

from app.api.mood.routes import mood_log_response
from app.models.mood import MoodLog


def test_mood_log_response_handles_missing_updated_at():
    now = datetime.now(timezone.utc)
    log = MoodLog(
        id="mood-1",
        user_id="user-1",
        mood=7,
        stress=3,
        energy=8,
        sleep=6,
        note="Feeling okay",
        logged_at=now,
        created_at=now,
    )

    response = mood_log_response(log)

    assert response.id == "mood-1"
    assert response.user_id == "user-1"
    assert response.mood == 7
    assert response.updated_at is None
