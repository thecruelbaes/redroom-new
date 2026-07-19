"""Live dictation app: tray + hotkey + mic -> pipeline -> text insertion."""

import logging
import sys
import threading
import time

from .config import AppConfig
from .pipeline import Pipeline
from .vad import SAMPLE_RATE

log = logging.getLogger(__name__)


def run_app(config: AppConfig) -> int:
    if sys.platform != "win32":
        print("Live mode requires Windows. Use --file <wav> for the CLI pipeline.",
              file=sys.stderr)
        return 1

    from .capture import MicRecorder
    from .hotkey import PushToTalk
    from .insert import insert_text
    from .tray import Status, TrayIcon

    app = _App(config, MicRecorder, PushToTalk, insert_text, Status, TrayIcon)
    return app.run()


class _App:
    def __init__(self, config, mic_cls, ptt_cls, insert_fn, status_enum, tray_cls):
        self.config = config
        self._mic_cls = mic_cls
        self._ptt_cls = ptt_cls
        self._insert = insert_fn
        self._status = status_enum
        self.tray = tray_cls(on_exit=self.shutdown)
        self.pipeline: Pipeline | None = None
        self.recorder = None
        self.hotkey = None
        self._busy = threading.Lock()  # one transcription at a time
        self._recording_active = False

    def run(self) -> int:
        threading.Thread(target=self._load_model, daemon=True).start()
        self.tray.run()  # blocks in the main thread until shutdown
        return 0

    def _load_model(self) -> None:
        try:
            from .asr import build_asr

            asr = build_asr(self.config)
            self.pipeline = Pipeline(self.config, asr)
            self.recorder = self._mic_cls()
            # hotkey goes live only now, when the model is resident
            self.hotkey = self._ptt_cls(
                self.config.hotkey, self._on_press, self._on_release
            )
            self.tray.set_status(self._status.IDLE)
            log.info("Ready. Hold %s to dictate.", self.config.hotkey)
        except Exception:
            log.exception("Startup failed")
            self.tray.stop()

    def _on_press(self) -> None:
        if not self._busy.acquire(blocking=False):
            log.warning("Still transcribing, press ignored")
            return
        self._recording_active = True
        self.recorder.start()
        self.tray.set_status(self._status.RECORDING)

    def _on_release(self) -> None:
        if not self._recording_active:
            return  # the matching press was ignored, nothing to stop
        self._recording_active = False
        released_at = time.perf_counter()
        audio = self.recorder.stop()
        self.tray.set_status(self._status.TRANSCRIBING)
        threading.Thread(
            target=self._transcribe_and_insert, args=(audio, released_at), daemon=True
        ).start()

    def _transcribe_and_insert(self, audio, released_at: float) -> None:
        try:
            result = self.pipeline.run(audio)
            if result.text:
                self._insert(result.text, self.config.insertion)
            latency = time.perf_counter() - released_at
            log.info(
                "Latency: %.2fs (audio %.1fs, %d chunk(s), vad %.2fs, asr %.2fs) -> %r",
                latency, len(audio) / SAMPLE_RATE, result.chunk_count,
                result.timings.get("vad", 0), result.timings.get("asr", 0),
                result.text[:80],
            )
        except Exception:
            log.exception("Transcription failed")
        finally:
            self.tray.set_status(self._status.IDLE)
            self._busy.release()

    def shutdown(self) -> None:
        log.info("Shutting down")
        if self.hotkey:
            self.hotkey.unhook()
        if self.recorder:
            self.recorder.close()
        self.tray.stop()
