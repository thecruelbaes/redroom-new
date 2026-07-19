"""Local ASR backend on faster-whisper (CTranslate2)."""

import logging

import ctranslate2
import numpy as np
from faster_whisper import WhisperModel

from .config import AppConfig, ModelConfig
from .postprocess import Segment

log = logging.getLogger(__name__)


def build_asr(config: AppConfig):
    return LocalASR(config.model, config.language)


class LocalASR:
    def __init__(self, cfg: ModelConfig, language: str | None = None):
        self.language = language
        device = cfg.device
        if device == "auto":
            device = "cuda" if ctranslate2.get_cuda_device_count() > 0 else "cpu"
        # Per spec: the big model is for GPU; on CPU go straight to the fallback.
        name = cfg.name if device == "cuda" else cfg.fallback
        try:
            self.model = self._load(name, device, cfg.compute_type)
        except Exception:
            if name == cfg.fallback and device == "cpu":
                raise
            log.exception("Failed to load %s on %s, falling back to %s on cpu",
                          name, device, cfg.fallback)
            self.model = self._load(cfg.fallback, "cpu", cfg.compute_type)

    @staticmethod
    def _load(name: str, device: str, compute_type: str) -> WhisperModel:
        log.info("Loading model %s (device=%s, compute_type=%s)", name, device, compute_type)
        model = WhisperModel(name, device=device, compute_type=compute_type)
        log.info("Model %s ready", name)
        return model

    def transcribe(self, audio: np.ndarray) -> list[Segment]:
        segments, info = self.model.transcribe(
            audio,
            language=self.language,
            condition_on_previous_text=False,
            vad_filter=False,  # VAD already applied upstream
        )
        result = [
            Segment(
                text=s.text,
                avg_logprob=s.avg_logprob,
                no_speech_prob=s.no_speech_prob,
            )
            for s in segments
        ]
        log.debug("Detected language: %s (p=%.2f), %d segments",
                  info.language, info.language_probability, len(result))
        return result
