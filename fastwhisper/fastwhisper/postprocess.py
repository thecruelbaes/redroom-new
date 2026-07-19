"""Post-processing: hallucination filtering and text assembly."""

import re
from dataclasses import dataclass


@dataclass
class Segment:
    text: str
    avg_logprob: float = 0.0
    no_speech_prob: float = 0.0


# Whisper hallucinations on silence/noise: exact matches after normalization.
_EXACT_PHRASES = {
    "продолжение следует",
    "спасибо за просмотр",
    "спасибо за внимание",
    "всем пока",
    "до новых встреч",
    "до встречи в следующем видео",
    "подписывайтесь на канал",
    "ставьте лайки",
    "thanks for watching",
    "thank you for watching",
    "please subscribe",
    "subscribe to my channel",
    "see you in the next video",
    "bye",
    "music",
    "музыка",
    "аплодисменты",
    "applause",
}

# Substring matches: YouTube-subtitle credits and similar artifacts.
_SUBSTRING_PHRASES = (
    "субтитры сделал",
    "субтитры делал",
    "субтитры создавал",
    "субтитры подготовил",
    "редактор субтитров",
    "корректор а егорова",
    "dimatorzok",
    "дима торжок",
    "amara org",
    "subtitles by",
    "субтитры от",
    "www youtube com",
)

# Segment quality gate: likely hallucination when the model is unsure the
# segment is speech AND has low confidence in the tokens it produced.
_NO_SPEECH_THRESHOLD = 0.6
_AVG_LOGPROB_THRESHOLD = -1.0

_NON_WORD_RE = re.compile(r"[^\w\s]+", re.UNICODE)
_WS_RE = re.compile(r"\s+")


def _normalize(text: str) -> str:
    text = _NON_WORD_RE.sub(" ", text.lower())
    return _WS_RE.sub(" ", text).strip()


def is_hallucination(text: str) -> bool:
    norm = _normalize(text)
    if not norm:
        return True
    if norm in _EXACT_PHRASES:
        return True
    return any(phrase in norm for phrase in _SUBSTRING_PHRASES)


def filter_segments(segments: list[Segment]) -> list[Segment]:
    """Drop hallucinated and low-confidence segments."""
    kept = []
    for seg in segments:
        if is_hallucination(seg.text):
            continue
        if (
            seg.no_speech_prob > _NO_SPEECH_THRESHOLD
            and seg.avg_logprob < _AVG_LOGPROB_THRESHOLD
        ):
            continue
        kept.append(seg)
    return kept


def join_texts(texts: list[str]) -> str:
    """Concatenate chunk texts with single-space separation."""
    return _WS_RE.sub(" ", " ".join(t.strip() for t in texts if t.strip())).strip()
