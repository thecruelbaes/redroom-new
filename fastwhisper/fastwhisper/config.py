"""Configuration loading: defaults + optional config.yaml overrides."""

import os
from dataclasses import dataclass, field, fields

import yaml


@dataclass
class ModelConfig:
    name: str = "large-v3-turbo"
    fallback: str = "small"
    device: str = "auto"  # auto | cuda | cpu
    compute_type: str = "int8"


@dataclass
class VadConfig:
    threshold: float = 0.5
    min_speech_duration_ms: int = 250
    min_silence_duration_ms: int = 300
    speech_pad_ms: int = 100


@dataclass
class ChunkingConfig:
    max_chunk_s: float = 30.0


@dataclass
class InsertionConfig:
    method: str = "paste"  # paste | type
    restore_clipboard: bool = True


@dataclass
class CloudConfig:
    enabled: bool = False
    base_url: str = "https://api.polza.ai/v1"
    api_key_env: str = "POLZA_API_KEY"
    model: str = "whisper-1"
    timeout_s: float = 30.0

    @property
    def api_key(self) -> str | None:
        return os.environ.get(self.api_key_env) or None


@dataclass
class AppConfig:
    model: ModelConfig = field(default_factory=ModelConfig)
    vad: VadConfig = field(default_factory=VadConfig)
    chunking: ChunkingConfig = field(default_factory=ChunkingConfig)
    insertion: InsertionConfig = field(default_factory=InsertionConfig)
    cloud: CloudConfig = field(default_factory=CloudConfig)
    language: str | None = None  # None = auto-detect
    hotkey: str = "ctrl+space"
    log_level: str = "INFO"


def _apply_section(section_obj, data: dict, path: str) -> None:
    valid = {f.name for f in fields(section_obj)}
    for key, value in data.items():
        if key not in valid:
            raise ValueError(f"Unknown config key: {path}.{key}")
        setattr(section_obj, key, value)


def load_config(path: str | None = None) -> AppConfig:
    """Build config from defaults, overridden by a YAML file if it exists."""
    cfg = AppConfig()
    if path is None:
        return cfg
    with open(path, encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    if not isinstance(data, dict):
        raise ValueError(f"Config root must be a mapping, got {type(data).__name__}")
    sections = {"model", "vad", "chunking", "insertion", "cloud"}
    for key, value in data.items():
        if key in sections:
            if not isinstance(value, dict):
                raise ValueError(f"Config section '{key}' must be a mapping")
            _apply_section(getattr(cfg, key), value, key)
        elif key in ("language", "hotkey", "log_level"):
            setattr(cfg, key, value)
        else:
            raise ValueError(f"Unknown config key: {key}")
    return cfg
