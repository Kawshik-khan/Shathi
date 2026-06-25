# Chatbot Style Fix Plan

## Problem

The chatbot was behaving like a repetitive therapist instead of a natural Bengali chat companion. Common failure patterns included over-validation, long multi-paragraph answers, repeated phrases like `আপনি বলছেন`, and no tone adaptation for casual, angry, romantic, or celebratory messages.

## Target Personality

- Smart online friend.
- Casual Bengali by default, using `তুমি`.
- Banglish input should be understood and answered in Bangla script.
- English should continue only after the user switches to English.
- Most replies should be 1-2 short sentences.
- Use humor and playful energy when appropriate.
- Avoid therapist-like language unless the crisis flow is triggered.

## Implementation

- Replace the old mental-health-first system prompt with a natural Bengali conversation prompt.
- Add a rule-based dialogue mode classifier:
  - `casual`
  - `playful`
  - `romantic`
  - `anger`
  - `sad`
  - `celebration`
  - `deep_support`
- Add mode-specific style instructions to the messages sent to the model.
- Tune generation settings:
  - `temperature=0.85`
  - `top_p=0.9`
  - `presence_penalty=0.4`
  - `frequency_penalty=0.5`
  - `max_tokens=220`
- Add anti-repetition checks for therapy-template phrases and overlong non-crisis responses.
- Retry or rewrite overly clinical responses once.
- Reuse the existing streaming `replace` event when a streamed answer needs cleanup.

## Safety

The existing crisis detection remains the hard safety layer. Serious self-harm, suicide, panic, hopelessness, or unsafe assistant content should still use the crisis response path. Normal sadness, anger, teasing, and romantic messages should not be escalated into therapy mode.

## Acceptance Tests

- `amar tomake mair dite mon chasche` should use anger/playful mode.
- `amar tomake chumma dite mon chasche` should use romantic/playful mode.
- `ami HSC te A+ peyechi` should use celebration mode.
- `amar mon kharap` should use short supportive mode.
- Replies containing banned therapy phrases should be rewritten.
- Long non-crisis replies should be rewritten.
- Crisis tests must continue to pass.
