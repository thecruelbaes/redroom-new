"""Insert text into the active window: clipboard + Ctrl+V, or direct typing.

Ctrl+V is simulated through SendInput (ctypes; pywin32 does not wrap
SendInput). Clipboard access uses pywin32's win32clipboard.
"""

import ctypes
import logging
import time
from ctypes import wintypes

import win32clipboard
import win32con

from .config import InsertionConfig

log = logging.getLogger(__name__)

_VK_CONTROL = 0x11
_VK_V = 0x56
_KEYEVENTF_KEYUP = 0x0002
_INPUT_KEYBOARD = 1

ULONG_PTR = ctypes.POINTER(ctypes.c_ulong)


class _KEYBDINPUT(ctypes.Structure):
    _fields_ = [
        ("wVk", wintypes.WORD),
        ("wScan", wintypes.WORD),
        ("dwFlags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", ctypes.c_size_t),
    ]


class _INPUT(ctypes.Structure):
    class _U(ctypes.Union):
        _fields_ = [("ki", _KEYBDINPUT), ("padding", ctypes.c_byte * 32)]

    _anonymous_ = ("u",)
    _fields_ = [("type", wintypes.DWORD), ("u", _U)]


def _send_keys(events: list[tuple[int, bool]]) -> None:
    inputs = (_INPUT * len(events))()
    for inp, (vk, up) in zip(inputs, events):
        inp.type = _INPUT_KEYBOARD
        inp.ki = _KEYBDINPUT(vk, 0, _KEYEVENTF_KEYUP if up else 0, 0, 0)
    sent = ctypes.windll.user32.SendInput(
        len(inputs), inputs, ctypes.sizeof(_INPUT)
    )
    if sent != len(inputs):
        raise OSError(f"SendInput sent {sent}/{len(inputs)} events")


def _send_ctrl_v() -> None:
    _send_keys([
        (_VK_CONTROL, False),
        (_VK_V, False),
        (_VK_V, True),
        (_VK_CONTROL, True),
    ])


def _get_clipboard_text() -> str | None:
    win32clipboard.OpenClipboard()
    try:
        if win32clipboard.IsClipboardFormatAvailable(win32con.CF_UNICODETEXT):
            return win32clipboard.GetClipboardData(win32con.CF_UNICODETEXT)
        return None  # non-text content is not preserved
    finally:
        win32clipboard.CloseClipboard()


def _set_clipboard_text(text: str) -> None:
    win32clipboard.OpenClipboard()
    try:
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardData(win32con.CF_UNICODETEXT, text)
    finally:
        win32clipboard.CloseClipboard()


def insert_text(text: str, cfg: InsertionConfig) -> None:
    if not text:
        return
    if cfg.method == "type":
        import keyboard

        keyboard.write(text)
        return

    previous = None
    try:
        previous = _get_clipboard_text()
    except Exception:
        log.warning("Could not read clipboard, previous content won't be restored")
    _set_clipboard_text(text)
    try:
        _send_ctrl_v()
    except Exception:
        log.exception("SendInput paste failed, falling back to typing")
        import keyboard

        keyboard.write(text)
        return
    finally:
        if cfg.restore_clipboard and previous is not None:
            # let the target app read the clipboard before restoring it
            time.sleep(0.3)
            try:
                _set_clipboard_text(previous)
            except Exception:
                log.warning("Could not restore clipboard")
