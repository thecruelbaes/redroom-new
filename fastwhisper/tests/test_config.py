import os
import tempfile
import unittest

from fastwhisper.config import AppConfig, load_config


class TestLoadConfig(unittest.TestCase):
    def _write(self, content: str) -> str:
        f = tempfile.NamedTemporaryFile(
            "w", suffix=".yaml", delete=False, encoding="utf-8"
        )
        f.write(content)
        f.close()
        self.addCleanup(os.unlink, f.name)
        return f.name

    def test_defaults_without_file(self):
        cfg = load_config(None)
        self.assertEqual(cfg.model.name, "large-v3-turbo")
        self.assertEqual(cfg.model.fallback, "small")
        self.assertEqual(cfg.model.compute_type, "int8")
        self.assertIsNone(cfg.language)
        self.assertEqual(cfg.hotkey, "ctrl+space")
        self.assertFalse(cfg.cloud.enabled)

    def test_partial_override(self):
        path = self._write("model:\n  name: tiny\nlanguage: ru\n")
        cfg = load_config(path)
        self.assertEqual(cfg.model.name, "tiny")
        self.assertEqual(cfg.model.fallback, "small")  # untouched default
        self.assertEqual(cfg.language, "ru")

    def test_unknown_key_rejected(self):
        path = self._write("modle:\n  name: tiny\n")
        with self.assertRaises(ValueError):
            load_config(path)

    def test_unknown_nested_key_rejected(self):
        path = self._write("model:\n  nmae: tiny\n")
        with self.assertRaises(ValueError):
            load_config(path)

    def test_empty_file_gives_defaults(self):
        path = self._write("")
        cfg = load_config(path)
        self.assertEqual(cfg.model.name, AppConfig().model.name)

    def test_api_key_from_env(self):
        path = self._write("cloud:\n  enabled: true\n  api_key_env: FW_TEST_KEY\n")
        cfg = load_config(path)
        self.assertIsNone(cfg.cloud.api_key)
        os.environ["FW_TEST_KEY"] = "secret123"
        self.addCleanup(os.environ.pop, "FW_TEST_KEY")
        self.assertEqual(cfg.cloud.api_key, "secret123")

    def test_missing_file_raises(self):
        with self.assertRaises(FileNotFoundError):
            load_config("/nonexistent/config.yaml")


if __name__ == "__main__":
    unittest.main()
