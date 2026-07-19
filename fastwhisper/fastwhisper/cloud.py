"""Cloud ASR backend: OpenAI-compatible /audio/transcriptions endpoint.

Uses stdlib urllib to avoid extra dependencies. Opt-in via cloud.enabled.
"""

import io
import json
import logging
import urllib.error
import urllib.request
import uuid
import wave

import numpy as np

from .config import CloudConfig
from .postprocess import Segment
from .vad import SAMPLE_RATE

log = logging.getLogger(__name__)


class CloudError(RuntimeError):
    """Cloud transcription failed in a way the user must know about."""


def _wav_bytes(audio: np.ndarray) -> bytes:
    pcm = (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


def _multipart(fields: dict[str, str], file_bytes: bytes) -> tuple[bytes, str]:
    boundary = uuid.uuid4().hex
    out = io.BytesIO()
    for name, value in fields.items():
        out.write(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"'
            f"\r\n\r\n{value}\r\n".encode()
        )
    out.write(
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; '
        f'filename="audio.wav"\r\nContent-Type: audio/wav\r\n\r\n'.encode()
    )
    out.write(file_bytes)
    out.write(f"\r\n--{boundary}--\r\n".encode())
    return out.getvalue(), f"multipart/form-data; boundary={boundary}"


class CloudASR:
    def __init__(self, cfg: CloudConfig, language: str | None = None):
        if not cfg.api_key:
            raise CloudError(
                f"Cloud mode is enabled but the {cfg.api_key_env} environment "
                f"variable is not set. Set it or disable cloud in config.yaml."
            )
        self.cfg = cfg
        self.language = language
        self.url = cfg.base_url.rstrip("/") + "/audio/transcriptions"
        log.info("Cloud ASR: %s (model=%s)", self.url, cfg.model)

    def transcribe(self, audio: np.ndarray) -> list[Segment]:
        fields = {"model": self.cfg.model, "response_format": "json"}
        if self.language:
            fields["language"] = self.language
        body, content_type = _multipart(fields, _wav_bytes(audio))
        request = urllib.request.Request(
            self.url,
            data=body,
            headers={
                "Authorization": f"Bearer {self.cfg.api_key}",
                "Content-Type": content_type,
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=self.cfg.timeout_s) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")[:300]
            raise CloudError(f"Cloud API error {e.code}: {detail}") from e
        except (urllib.error.URLError, TimeoutError) as e:
            reason = getattr(e, "reason", e)
            raise CloudError(
                f"Cannot reach cloud API at {self.url}: {reason}. "
                f"Check your network or disable cloud in config.yaml."
            ) from e
        text = payload.get("text")
        if text is None:
            raise CloudError(f"Unexpected cloud API response: {str(payload)[:300]}")
        return [Segment(text=text)]
