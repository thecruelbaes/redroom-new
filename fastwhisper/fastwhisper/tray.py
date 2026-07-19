"""System tray icon (pystray) showing app status by color."""

import enum
import logging

import pystray
from PIL import Image, ImageDraw

log = logging.getLogger(__name__)


class Status(enum.Enum):
    LOADING = ("loading model...", (90, 120, 220))
    IDLE = ("idle", (120, 120, 120))
    RECORDING = ("recording", (220, 60, 60))
    TRANSCRIBING = ("transcribing", (230, 180, 40))


def _circle_icon(color: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    ImageDraw.Draw(img).ellipse((8, 8, 56, 56), fill=color + (255,))
    return img


class TrayIcon:
    def __init__(self, on_exit):
        self._images = {s: _circle_icon(s.value[1]) for s in Status}
        self._icon = pystray.Icon(
            "fastwhisper",
            icon=self._images[Status.LOADING],
            title="FastWhisper: loading model...",
            menu=pystray.Menu(pystray.MenuItem("Exit", lambda: on_exit())),
        )

    def set_status(self, status: Status) -> None:
        self._icon.icon = self._images[status]
        self._icon.title = f"FastWhisper: {status.value[0]}"

    def run(self) -> None:
        """Blocks until stop() is called (must run in the main thread)."""
        self._icon.run()

    def stop(self) -> None:
        self._icon.stop()
