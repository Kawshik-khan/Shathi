from app.services.localization import (
    is_banglish_dominant,
    should_switch_to_bangla,
    should_switch_to_english,
)


def test_chat_language_defaults_to_bangla_for_banglish():
    assert is_banglish_dominant("ami valo nai") is True
    assert should_switch_to_english("ami valo nai") is False
    assert should_switch_to_bangla("ami valo nai") is True


def test_chat_language_detects_common_banglish_feeling_message():
    assert is_banglish_dominant("amar mon kharap") is True
    assert should_switch_to_english("amar mon kharap") is False
    assert should_switch_to_bangla("amar mon kharap") is True


def test_chat_language_detects_romanized_bangla_request():
    assert is_banglish_dominant("tumi banglay bolo") is True
    assert should_switch_to_english("tumi banglay bolo") is False
    assert should_switch_to_bangla("tumi banglay bolo") is True


def test_chat_language_switches_to_english_for_explicit_english_request():
    assert should_switch_to_english("Please continue with English") is True


def test_chat_language_switches_to_english_for_plain_english_message():
    assert should_switch_to_english("I feel anxious today") is True
