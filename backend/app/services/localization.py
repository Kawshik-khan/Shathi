"""Localization helpers for Bangladesh-specific behavior."""

from typing import Literal

LanguageCode = Literal["en", "bn"]

BANGLISH_TOKENS = {
    "ache",
    "achi",
    "amar",
    "amake",
    "ami",
    "amra",
    "apnar",
    "apni",
    "baloi",
    "bangla",
    "banglay",
    "bhalo",
    "bolo",
    "bolen",
    "bolte",
    "chai",
    "chinta",
    "dorkar",
    "emon",
    "eta",
    "hobe",
    "hocche",
    "kemon",
    "keno",
    "kharap",
    "kichu",
    "ki",
    "kisu",
    "korbo",
    "korte",
    "lagche",
    "mon",
    "mone",
    "na",
    "nai",
    "parchi",
    "pari",
    "tomar",
    "tumi",
    "valo",
}

BANGLISH_PHRASES = (
    "ami valo nai",
    "ami bhalo nai",
    "amar mon kharap",
    "mon valo nai",
    "mon bhalo nai",
    "banglay bolo",
    "bangla te bolo",
    "banglate bolo",
    "bangla bolo",
)


def normalize_language(language: str | None) -> LanguageCode:
    """Return a supported language code."""
    return "bn" if language == "bn" else "en"


def detect_language(text: str) -> LanguageCode:
    """Detect Bengali text using the Bengali Unicode block."""
    bengali_chars = sum(1 for char in text if "\u0980" <= char <= "\u09ff")
    return "bn" if bengali_chars >= 2 else "en"


def requests_english(text: str) -> bool:
    """Return True when the user explicitly asks to use English."""
    lowered = text.casefold()
    english_phrases = (
        "english",
        "in eng",
        "speak eng",
        "talk eng",
        "reply eng",
        "respond eng",
        "continue eng",
        "use eng",
        "english e",
        "\u0987\u0982\u09b0\u09c7\u099c\u09bf",
        "\u0987\u0982\u09b2\u09bf\u09b6",
    )
    return any(phrase in lowered for phrase in english_phrases)


def requests_bangla(text: str) -> bool:
    """Return True when the user explicitly asks to use Bengali."""
    lowered = text.casefold()
    bangla_phrases = (
        "bangla",
        "banglay",
        "bengali",
        "\u09ac\u09be\u0982\u09b2\u09be",
        "\u09ac\u09be\u0982\u09b2\u09be\u09df",
    )
    return any(phrase in lowered for phrase in bangla_phrases)


def _latin_words(text: str) -> list[str]:
    """Return lowercase Latin words from a message."""
    words: list[str] = []
    current: list[str] = []

    for char in text.casefold():
        if "a" <= char <= "z":
            current.append(char)
        elif current:
            words.append("".join(current))
            current = []

    if current:
        words.append("".join(current))

    return words


def is_banglish_dominant(text: str) -> bool:
    """Detect romanized Bangla written with Latin characters."""
    lowered = text.casefold()
    if any(phrase in lowered for phrase in BANGLISH_PHRASES):
        return True

    words = _latin_words(text)
    if not words:
        return False

    banglish_count = sum(1 for word in words if word in BANGLISH_TOKENS)
    return banglish_count >= 2 or (banglish_count == 1 and requests_bangla(text))


def is_english_dominant(text: str) -> bool:
    """Detect messages that are primarily written with Latin letters."""
    letters = [char for char in text if char.isalpha()]
    if not letters:
        return False

    latin_letters = [
        char for char in letters if ("a" <= char.casefold() <= "z")
    ]
    return len(latin_letters) / len(letters) >= 0.8 and len(latin_letters) >= 3


def should_switch_to_english(text: str) -> bool:
    """Decide whether a user message should move the conversation to English."""
    return requests_english(text) or (
        is_english_dominant(text) and not is_banglish_dominant(text)
    )


def should_switch_to_bangla(text: str) -> bool:
    """Decide whether a user message should move the conversation to Bengali."""
    return detect_language(text) == "bn" or requests_bangla(text) or is_banglish_dominant(text)


def cultural_context_for(language: LanguageCode) -> str:
    """Prompt context for localized mental-health support."""
    if language != "bn":
        return ""

    return (
        "Respond in Bengali by default. If the user explicitly asks for English "
        "or has switched to English in this conversation, continue in English. "
        "If the user writes Banglish or romanized Bangla, understand it as "
        "Bengali and reply in Bengali script. "
        "Use Bangladesh cultural context, be "
        "respectful of Muslim and Hindu family norms, avoid assumptions about "
        "religion, and use clear Bengali mental-health terms with gentle phrasing."
    )
