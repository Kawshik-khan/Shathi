"""Crisis detection service."""
from enum import Enum
from typing import Dict, List, Tuple

import httpx

from app.core.config import get_settings

settings = get_settings()


class CrisisSeverity(Enum):
    """Crisis severity levels."""
    
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class CrisisResult:
    """Crisis detection result."""
    
    def __init__(
        self,
        is_crisis: bool,
        severity: CrisisSeverity,
        category: str,
        confidence: float,
        response_template: str,
    ):
        self.is_crisis = is_crisis
        self.severity = severity
        self.category = category
        self.confidence = confidence
        self.response_template = response_template


# Crisis keywords and patterns
CRISIS_PATTERNS = {
    CrisisSeverity.HIGH: {
        "suicide": [
            "kill myself",
            "end my life",
            "suicide",
            "don't want to live",
            "better off dead",
            "no reason to live",
        ],
        "self_harm": [
            "cut myself",
            "hurt myself",
            "self harm",
            "self-harm",
            "burn myself",
        ],
    },
    CrisisSeverity.MEDIUM: {
        "panic": [
            "panic attack",
            "can't breathe",
            "heart racing",
            "losing control",
        ],
        "hopelessness": [
            "no hope",
            "nothing matters",
            "give up",
            "can't go on",
            "too much pain",
        ],
    },
    CrisisSeverity.LOW: {
        "sadness": [
            "very sad",
            "deeply depressed",
            "can't stop crying",
            "emptiness",
        ],
    },
}

SEVERITY_RANK = {
    CrisisSeverity.LOW: 1,
    CrisisSeverity.MEDIUM: 2,
    CrisisSeverity.HIGH: 3,
}

UNSAFE_ASSISTANT_PATTERNS = [
    "you should kill yourself",
    "go kill yourself",
    "hurt yourself",
    "cut yourself",
    "stop taking your medication",
    "ignore your doctor",
    "you do not need professional help",
    "there is no point getting help",
]

# Safe response templates
SAFE_RESPONSES = {
    "suicide": (
        "I'm really concerned about what you've shared. Your life matters, and there are "
        "people who want to help. Please reach out to a crisis helpline:\n\n"
        "🇺🇸 988 Suicide & Crisis Lifeline (call or text 988)\n"
        "🇬🇧 Samaritans at 116 123\n"
        "🌐 Find your country: https://findahelpline.com\n\n"
        "You're not alone in this."
    ),
    "self_harm": (
        "I hear that you're going through a really difficult time. Self-harm is a sign of "
        "deep distress, and you deserve support. Please consider reaching out:\n\n"
        "🇺🇸 Crisis Text Line: Text HOME to 741741\n"
        "🇬🇧 Self Injury Support: https://selfinjurysupport.org.uk\n\n"
        "There are healthier ways to cope, and people who can help you find them."
    ),
    "panic": (
        "It sounds like you might be experiencing a panic attack. Let's try to ground you:\n\n"
        "🫁 Breathe: Inhale for 4 counts, hold for 4, exhale for 4\n"
        "👀 Look around: Name 5 things you can see, 4 you can touch, 3 you can hear\n"
        "💧 Drink water and focus on the sensation\n\n"
        "This will pass. Panic attacks are scary but not dangerous."
    ),
    "hopelessness": (
        "I'm so sorry you're feeling this way. Hopelessness can make everything feel dark, "
        "but feelings change, and circumstances can improve.\n\n"
        "You don't have to carry this alone. Would you consider:\n"
        "• Talking to someone you trust\n"
        "• Speaking with a mental health professional\n"
        "• Calling a helpline if these feelings persist\n\n"
        "You matter, even when it doesn't feel that way."
    ),
    "general_crisis": (
        "I can hear that you're in a lot of pain right now. Thank you for trusting me with that. "
        "Please reach out to someone who can provide more support:\n\n"
        "🆘 Crisis support is available 24/7\n"
        "📞 988 Suicide & Crisis Lifeline\n"
        "💬 Crisis Text Line: Text HOME to 741741\n\n"
        "You don't have to face this alone."
    ),
}


async def detect_crisis(text: str) -> CrisisResult:
    """Detect crisis indicators in text."""
    text_lower = text.lower()
    
    # Check for crisis patterns
    detected_severity = None
    detected_category = None
    highest_confidence = 0.0
    
    for severity, categories in CRISIS_PATTERNS.items():
        for category, patterns in categories.items():
            matches = sum(1 for pattern in patterns if pattern in text_lower)
            if matches > 0:
                confidence = min(matches / len(patterns) + 0.3, 1.0)
                
                if detected_severity is None or SEVERITY_RANK[severity] > SEVERITY_RANK[detected_severity]:
                    detected_severity = severity
                    detected_category = category
                    highest_confidence = confidence
    
    if detected_severity is None:
        return CrisisResult(
            is_crisis=False,
            severity=CrisisSeverity.LOW,
            category="none",
            confidence=0.0,
            response_template="",
        )
    
    # Get appropriate response
    response = SAFE_RESPONSES.get(
        detected_category,
        SAFE_RESPONSES["general_crisis"],
    )
    
    return CrisisResult(
        is_crisis=True,
        severity=detected_severity,
        category=detected_category,
        confidence=highest_confidence,
        response_template=response,
    )


def get_crisis_resources() -> Dict[str, List[Dict[str, str]]]:
    """Get crisis support resources."""
    return {
        "immediate": [
            {"name": "988 Suicide & Crisis Lifeline", "phone": "988", "text": "988"},
            {"name": "Crisis Text Line", "phone": "", "text": "Text HOME to 741741"},
        ],
        "international": [
            {"name": "Find A Helpline", "url": "https://findahelpline.com"},
            {"name": "Befrienders Worldwide", "url": "https://www.befrienders.org"},
        ],
    }


def filter_unsafe_assistant_response(text: str) -> Tuple[bool, str]:
    """Replace obviously unsafe assistant content with a safe support response."""
    text_lower = text.lower()
    if any(pattern in text_lower for pattern in UNSAFE_ASSISTANT_PATTERNS):
        return True, SAFE_RESPONSES["general_crisis"]

    return False, text

