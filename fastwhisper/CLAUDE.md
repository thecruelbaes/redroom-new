# Project: FastWhisper — local voice-to-text dictation tool for Windows

IMPORTANT: Communicate with the user in Russian. Code, comments, and commit
messages stay in English.

## Goal
Wispr Flow / WhisperMe-style dictation: hold a global hotkey, speak, release —
transcribed text is inserted into the active window. Russian + English,
auto-detect. Default is fully local/offline.

## Architecture (do not change without asking the user)
- Python 3.11+, faster-whisper (CTranslate2), "large-v3-turbo" int8 on GPU,
  auto-fallback to "small" on CPU or load failure.
- VAD: Silero (the ONNX model bundled with faster-whisper — deliberate choice,
  the standalone silero-vad pip package pulls in full PyTorch).
- Audio: sounddevice, 16 kHz mono, persistent input stream.
- Hotkey: `keyboard` lib, push-to-talk, default ctrl+space (config.yaml).
- Insertion: clipboard + Ctrl+V via SendInput (ctypes structs; pywin32 only
  for clipboard), clipboard restored after paste; fallback: direct typing.
- Tray: pystray (loading / idle / recording / transcribing).
- Cloud (opt-in, default off): OpenAI-compatible /audio/transcriptions,
  key via env var POLZA_API_KEY, stdlib urllib — no requests dependency.

## Current state (all 5 phases implemented, developed in a Linux container)
- CLI: `python -m fastwhisper --file test.wav [--model tiny] [-v]`;
  config.yaml in cwd is auto-loaded, or pass --config.
- Live mode: `python -m fastwhisper` (Windows only).
- Tests: `python -m unittest discover -s tests` — 32 tests, all green
  (stdlib unittest on purpose; ask the user before adding pytest).
- VERIFIED in the container: unit tests, VAD gating on real audio
  (testdata/jfk_en.wav, testdata/silence_5s.wav), full CLI cloud path
  against a mock HTTP server, silence never reaches ASR.
- NOT verified (container had no Windows APIs and huggingface.co was
  blocked): real Whisper model inference, mic capture, global hotkey,
  SendInput paste, clipboard restore, tray. See HANDOFF.md for the
  prioritized verification checklist — run it before building features.

## Rules
- Ask before adding any new dependency.
- Small commits per feature. No dead code, no speculative abstractions.
- Anything untestable must be stated explicitly with a manual checklist
  in Russian, never presented as working.
- Known hard problems (hallucinations on silence, model residency, >30s
  chunking, latency logging) are addressed in code — keep those guarantees
  when refactoring.
