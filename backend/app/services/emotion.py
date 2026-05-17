"""Emotion detection service using transformers."""
from typing import Dict, Literal, Optional
from enum import Enum

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False

try:
    from app.core.config import get_settings
    settings = get_settings()
except:
    settings = None

EMOTION_CATEGORIES = [
    "sadness",
    "anxiety",
    "stress",
    "loneliness",
    "burnout",
    "frustration",
    "happiness",
    "neutral",
]


class EmotionResult:
    """Emotion detection result."""
    
    def __init__(
        self,
        emotion: str,
        confidence: float,
        scores: Dict[str, float],
    ):
        self.emotion = emotion
        self.confidence = confidence
        self.scores = scores


async def detect_emotion(text: str) -> EmotionResult:
    """Detect emotion in text using Hugging Face API."""
    if not settings.HF_API_TOKEN:
        # Fallback: simple keyword detection
        return _keyword_emotion_detection(text)
    
    # Use Hugging Face Inference API for emotion classification
    model = "j-hartmann/emotion-english-distilroberta-base"
    api_url = f"https://api-inference.huggingface.co/models/{model}"
    headers = {"Authorization": f"Bearer {settings.HF_API_TOKEN}"}
    
    payload = {"inputs": text}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                api_url,
                headers=headers,
                json=payload,
                timeout=30.0,
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Parse result
                if isinstance(result, list) and len(result) > 0:
                    emotions = result[0]
                    
                    # Find highest scoring emotion
                    best_emotion = max(emotions, key=lambda x: x["score"])
                    
                    # Map to our categories
                    emotion_map = {
                        "sadness": "sadness",
                        "fear": "anxiety",
                        "anger": "frustration",
                        "joy": "happiness",
                        "neutral": "neutral",
                        "disgust": "stress",
                        "surprise": "neutral",
                    }
                    
                    mapped_emotion = emotion_map.get(
                        best_emotion["label"].lower(),
                        "neutral",
                    )
                    
                    scores = {e["label"]: e["score"] for e in emotions}
                    
                    return EmotionResult(
                        emotion=mapped_emotion,
                        confidence=best_emotion["score"],
                        scores=scores,
                    )
            
            # Fallback if API fails
            return _keyword_emotion_detection(text)
            
        except Exception:
            return _keyword_emotion_detection(text)


def _keyword_emotion_detection(text: str) -> EmotionResult:
    """Simple keyword-based emotion detection as fallback."""
    text_lower = text.lower()
    
    keywords = {
        "sadness": ["sad", "depressed", "down", "blue", "unhappy", "crying", "tears"],
        "anxiety": ["anxious", "worried", "nervous", "panic", "scared", "fear", "stressed"],
        "stress": ["stressed", "overwhelmed", "pressure", "burnout", "exhausted"],
        "loneliness": ["lonely", "alone", "isolated", "no friends", "miss"],
        "frustration": ["angry", "frustrated", "annoyed", "mad", "irritated"],
        "happiness": ["happy", "joy", "excited", "grateful", "blessed", "good"],
    }
    
    scores = {}
    for emotion, words in keywords.items():
        score = sum(1 for word in words if word in text_lower)
        scores[emotion] = score / len(words) if words else 0
    
    if not scores or max(scores.values()) == 0:
        return EmotionResult("neutral", 1.0, {"neutral": 1.0})
    
    best_emotion = max(scores, key=scores.get)
    confidence = scores[best_emotion]
    
    # Normalize scores
    total = sum(scores.values())
    normalized_scores = {k: v / total for k, v in scores.items()}
    
    return EmotionResult(best_emotion, confidence, normalized_scores)

