"""Microphone capture via sounddevice (WASAPI on Windows), 16 kHz mono."""

import logging
import threading

import numpy as np
import sounddevice as sd

from .vad import SAMPLE_RATE

log = logging.getLogger(__name__)


class MicRecorder:
    """Keeps one input stream open; buffers audio only while recording.

    A persistent stream avoids the 100-300 ms device-open delay on every
    push-to-talk press, which would clip the start of the utterance.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._chunks: list[np.ndarray] = []
        self._recording = False
        self._stream = sd.InputStream(
            samplerate=SAMPLE_RATE, channels=1, dtype="float32",
            callback=self._callback,
        )
        self._stream.start()
        log.info("Microphone stream open: %s", sd.query_devices(kind="input")["name"])

    def _callback(self, indata, frames, time_info, status):
        if status:
            log.warning("Audio input status: %s", status)
        with self._lock:
            if self._recording:
                self._chunks.append(indata[:, 0].copy())

    def start(self) -> None:
        with self._lock:
            self._chunks = []
            self._recording = True

    def stop(self) -> np.ndarray:
        with self._lock:
            self._recording = False
            chunks, self._chunks = self._chunks, []
        if not chunks:
            return np.zeros(0, dtype=np.float32)
        return np.concatenate(chunks)

    def close(self) -> None:
        self._stream.stop()
        self._stream.close()
