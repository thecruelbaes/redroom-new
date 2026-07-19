"""Silero VAD wrapper (ONNX model bundled with faster-whisper)."""

import numpy as np
from faster_whisper.vad import VadOptions, get_speech_timestamps

from .config import VadConfig

SAMPLE_RATE = 16000


def detect_speech(audio: np.ndarray, cfg: VadConfig) -> list[dict]:
    """Return speech regions as [{'start': samples, 'end': samples}, ...]."""
    options = VadOptions(
        threshold=cfg.threshold,
        min_speech_duration_ms=cfg.min_speech_duration_ms,
        min_silence_duration_ms=cfg.min_silence_duration_ms,
        speech_pad_ms=cfg.speech_pad_ms,
    )
    return get_speech_timestamps(audio, options, sampling_rate=SAMPLE_RATE)
