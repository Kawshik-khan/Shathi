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
    system_message = "\n\n".join(
        m["content"] for m in messages if m["role"] == "system"
    )

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


# ---------------------------------------------------------------------------
# Persona Contract: anti-sympathy openers, voice/vocabulary, emoji/humor rails
# ---------------------------------------------------------------------------


def test_prompt_lists_anti_sympathy_openers():
    """The four reflective-sympathy openers from the Persona Contract must be
    enumerated in the system prompt so the model is told to vary its opener."""
    for opener in (
        "আমি দুঃখিত",
        "শুনে খারাপ লাগল",
        "আমি বুঝতে পারছি",
        "তোমার জন্য খারাপ লাগছে",
    ):
        assert opener in SYSTEM_PROMPT, f"Missing anti-sympathy opener: {opener}"


def test_detects_reflective_sympathy_opener():
    """BANNED_THERAPY_PHRASES catches reflective-sympathy openers so
    needs_style_rewrite triggers a casual rewrite."""
    samples = (
        "আমি দুঃখিত তুমি এমন বোধ করছ।",
        "শুনে খারাপ লাগল যে তোমার দিন খারাপ গেছে।",
        "আমি বুঝতে পারছি এটা কঠিন।",
        "তোমার জন্য খারাপ লাগছে।",
    )
    for text in samples:
        assert has_therapy_template(text) is True, f"Not flagged: {text}"
        assert needs_style_rewrite(text) is True, f"Not flagged: {text}"


def test_prompt_specifies_natural_bangla_lexicon():
    """The voice-and-vocabulary section must steer the model away from
    formal/clinical Bengali and toward casual natural words."""
    natural_pairs = (
        ("চাপ লাগছে", "মানসিক চাপ"),
        ("লাগছে", "অনুভব"),
        ("সাহায্য", "সহায়তা"),
    )
    for casual_word, clinical_word in natural_pairs:
        assert casual_word in SYSTEM_PROMPT, f"Missing casual form: {casual_word}"
        assert clinical_word in SYSTEM_PROMPT, f"Missing clinical form: {clinical_word}"


def test_prompt_caps_followup_questions():
    """Global rule: ask at most one short follow-up question per reply."""
    assert "at most one" in SYSTEM_PROMPT
    assert "one short follow-up question" in SYSTEM_PROMPT


def test_prompt_enforces_emoji_sparingly_rule():
    """The emoji cap must be in the prompt so the model does not stack them."""
    assert "emojis sparingly" in SYSTEM_PROMPT
    assert "0-2 per reply" in SYSTEM_PROMPT
    # Crisis branch must skip emojis entirely.
    assert "Skip them entirely on crisis replies" in SYSTEM_PROMPT


def test_prompt_enforces_humor_guard_rails():
    """Humor is allowed in casual/playful/anger/celebration but blocked
    in sad, deep_support, and crisis."""
    assert "Humor is welcome" in SYSTEM_PROMPT
    assert "sad" in SYSTEM_PROMPT
    assert "deep_support" in SYSTEM_PROMPT
    assert "crisis" in SYSTEM_PROMPT


def test_prompt_keeps_english_mode_persona():
    """When the user switches to English, the same casual friend persona
    applies — no "I'm sorry to hear that" or "I'm here for you" openers."""
    assert "English-mode persona" in SYSTEM_PROMPT
    assert "I'm sorry to hear that" in SYSTEM_PROMPT
    assert "I'm here for you" in SYSTEM_PROMPT


def test_persona_mirror_short_replies_pass_style_check():
    """Spec-style natural replies must NOT trip needs_style_rewrite."""
    good_replies = (
        "উফ, কী হয়েছে? বলো।",           # sad opener, varied
        "OHH congrats 😭🔥 treat kothay?", # celebration, ≤2 emojis
        "are bhai, ami abar ki korlam?", # anger, casual
    )
    for reply in good_replies:
        assert needs_style_rewrite(reply) is False, f"Falsely flagged: {reply}"


def test_short_clinical_opener_still_flagged():
    """Even a short reply that opens with a banned phrase must be flagged."""
    assert needs_style_rewrite("আমি দুঃখিত, কী হয়েছে?") is True
