"""Global push-to-talk hotkey via the `keyboard` library."""

import logging

import keyboard

log = logging.getLogger(__name__)


class PushToTalk:
    """Calls on_press when the full combo goes down, on_release when the
    main (last) key comes back up. Combo format: "ctrl+space"."""

    def __init__(self, combo: str, on_press, on_release):
        parts = [p.strip() for p in combo.lower().split("+") if p.strip()]
        if not parts:
            raise ValueError(f"Invalid hotkey: {combo!r}")
        self._modifiers = parts[:-1]
        self._key = parts[-1]
        self._on_press = on_press
        self._on_release = on_release
        self._active = False
        self._hooks = [
            keyboard.on_press_key(self._key, self._handle_press, suppress=False),
            keyboard.on_release_key(self._key, self._handle_release, suppress=False),
        ]
        log.info("Push-to-talk registered: %s", combo)

    def _handle_press(self, event) -> None:
        if self._active:
            return  # key autorepeat while held
        if all(keyboard.is_pressed(m) for m in self._modifiers):
            self._active = True
            self._on_press()

    def _handle_release(self, event) -> None:
        if self._active:
            self._active = False
            self._on_release()

    def unhook(self) -> None:
        for hook in self._hooks:
            keyboard.unhook(hook)
        self._hooks = []
