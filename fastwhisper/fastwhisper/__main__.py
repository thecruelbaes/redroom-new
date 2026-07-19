"""CLI entry point: `python -m fastwhisper --file test.wav` or live mode."""

import argparse
import logging
import sys
import time


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="fastwhisper",
        description="Local voice-to-text dictation (faster-whisper).",
    )
    parser.add_argument("--file", help="Transcribe a WAV file and print the result")
    parser.add_argument("--config", default=None, help="Path to config.yaml")
    parser.add_argument("--model", default=None,
                        help="Override model name (e.g. tiny, small, large-v3-turbo)")
    parser.add_argument("--language", default=None, help="Force language (ru/en); default auto")
    parser.add_argument("-v", "--verbose", action="store_true", help="Debug logging")
    args = parser.parse_args()

    from .config import load_config

    config = load_config(args.config)
    if args.language:
        config.language = args.language
    if args.model:
        # Explicit override: use exactly this model, no GPU-based downgrade.
        config.model.name = args.model
        config.model.fallback = args.model

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else config.log_level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        stream=sys.stderr,
    )

    if args.file:
        return run_file(args.file, config)

    from .app import run_app

    return run_app(config)


def run_file(path: str, config) -> int:
    from faster_whisper.audio import decode_audio

    from .asr import build_asr
    from .cloud import CloudError
    from .pipeline import Pipeline
    from .vad import SAMPLE_RATE

    log = logging.getLogger("fastwhisper.cli")
    audio = decode_audio(path, sampling_rate=SAMPLE_RATE)
    log.info("Loaded %s: %.1fs", path, len(audio) / SAMPLE_RATE)

    try:
        t0 = time.perf_counter()
        asr = build_asr(config)
        log.info("Model loaded in %.1fs", time.perf_counter() - t0)
        result = Pipeline(config, asr).run(audio)
    except CloudError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 2
    log.info("Timings: vad=%.2fs asr=%.2fs, chunks=%d, speech=%s",
             result.timings.get("vad", 0), result.timings.get("asr", 0),
             result.chunk_count, result.speech_detected)
    print(result.text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
