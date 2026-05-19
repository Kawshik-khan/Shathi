from app.services.ai import (
    GENERATION_OPTIONS,
    SYSTEM_PROMPT,
    _build_messages,
    classify_dialogue_mode,
    has_therapy_template,
    is_overlong_non_crisis_response,
    needs_style_rewrite,
)


def test_classifies_angry_banglish_as_anger():
    assert classify_dialogue_mode("amar tomake mair dite mon chasche") == "anger"


def test_classifies_romantic_banglish_as_romantic():
    assert classify_dialogue_mode("amar tomake chumma dite mon chasche") == "romantic"


def test_classifies_celebration_as_celebration():
    assert classify_dialogue_mode("ami HSC te A+ peyechi") == "celebration"


def test_classifies_sad_banglish_as_sad():
    assert classify_dialogue_mode("amar mon kharap") == "sad"


def test_prompt_blocks_therapy_loop_and_defaults_to_tumi():
    messages = _build_messages("amar mon kharap", [], "bn")
    system_message = messages[0]["content"]

    assert "Do NOT respond like a therapist" in system_message
    assert "casual তুমি" in system_message
    assert "আপনি বলছেন" in system_message
    assert "Bangla script" in system_message


def test_prompt_includes_private_user_context_quietly():
    messages = _build_messages(
        "amar mon kharap",
        [],
        "bn",
        user_context="Mood signal: recent mood is low.",
    )
    system_message = messages[0]["content"]

    assert "Private personalization context" in system_message
    assert "Mood signal: recent mood is low." in system_message
    assert "Do not quote it" in system_message


def test_generation_options_allow_more_response_diversity():
    assert GENERATION_OPTIONS["temperature"] == 0.85
    assert GENERATION_OPTIONS["top_p"] == 0.9
    assert GENERATION_OPTIONS["presence_penalty"] == 0.4
    assert GENERATION_OPTIONS["frequency_penalty"] == 0.5
    assert GENERATION_OPTIONS["max_tokens"] <= 220


def test_detects_banned_therapy_template():
    response = "আপনি বলছেন যে আপনার মন খারাপ। আপনার অনুভূতি গুরুত্বপূর্ণ।"

    assert has_therapy_template(response) is True
    assert needs_style_rewrite(response) is True


def test_detects_overlong_non_crisis_response():
    response = " ".join(["কথা"] * 100)

    assert is_overlong_non_crisis_response(response) is True
    assert needs_style_rewrite(response) is True


def test_short_casual_reply_passes_style_check():
    assert needs_style_rewrite("উফ 😔 কী হইছে?") is False
    assert "therapist" in SYSTEM_PROMPT
