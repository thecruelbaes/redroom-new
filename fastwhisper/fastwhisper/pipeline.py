"""Full transcription pipeline: VAD -> chunking -> ASR -> post-processing."""

import logging
import time
from dataclasses import dataclass, field

import numpy as np

from .chunking import split_into_chunks
from .config import AppConfig
from .postprocess import filter_segments, join_texts
from .vad import SAMPLE_RATE, detect_speech

log = logging.getLogger(__name__)


@dataclass
class TranscriptionResult:
    text: str
    speech_detected: bool
    chunk_count: int = 0
    timings: dict = field(default_factory=dict)


class Pipeline:
    def __init__(self, config: AppConfig, asr):
        self.config = config
        self.asr = asr

    def run(self, audio: np.ndarray) -> TranscriptionResult:
        t0 = time.perf_counter()
        speech_ts = detect_speech(audio, self.config.vad)
        t_vad = time.perf_counter() - t0
        if not speech_ts:
            log.info("No speech detected (%.1fs audio), skipping ASR", len(audio) / SAMPLE_RATE)
            return TranscriptionResult(text="", speech_detected=False,
                                       timings={"vad": t_vad, "asr": 0.0})

        max_chunk_len = int(self.config.chunking.max_chunk_s * SAMPLE_RATE)
        chunks = split_into_chunks(speech_ts, max_chunk_len)
        log.info("Speech: %d region(s) -> %d chunk(s)", len(speech_ts), len(chunks))

        t1 = time.perf_counter()
        texts = []
        for i, (start, end) in enumerate(chunks):
            segments = filter_segments(self.asr.transcribe(audio[start:end]))
            texts.append(join_texts([s.text for s in segments]))
            log.debug("Chunk %d/%d (%.1fs): %d segment(s) kept",
                      i + 1, len(chunks), (end - start) / SAMPLE_RATE, len(segments))
        t_asr = time.perf_counter() - t1

        return TranscriptionResult(
            text=join_texts(texts),
            speech_detected=True,
            chunk_count=len(chunks),
            timings={"vad": t_vad, "asr": t_asr},
        )
