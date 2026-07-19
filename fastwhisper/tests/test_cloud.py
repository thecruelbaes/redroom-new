import json
import os
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer

import numpy as np

from fastwhisper.cloud import CloudASR, CloudError
from fastwhisper.config import CloudConfig

KEY_ENV = "FW_TEST_CLOUD_KEY"


class _Handler(BaseHTTPRequestHandler):
    status = 200
    body = {"text": " Привет, мир. "}

    def do_POST(self):
        length = int(self.headers["Content-Length"])
        self.server.last_request = {
            "path": self.path,
            "auth": self.headers.get("Authorization"),
            "content_type": self.headers.get("Content-Type"),
            "body": self.rfile.read(length),
        }
        payload = json.dumps(_Handler.body).encode()
        self.send_response(_Handler.status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):
        pass


class TestCloudASR(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = HTTPServer(("127.0.0.1", 0), _Handler)
        cls.server.last_request = None
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.base_url = f"http://127.0.0.1:{cls.server.server_port}/v1"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def setUp(self):
        _Handler.status = 200
        os.environ[KEY_ENV] = "test-key-123"
        self.addCleanup(os.environ.pop, KEY_ENV, None)
        self.cfg = CloudConfig(
            enabled=True, base_url=self.base_url, api_key_env=KEY_ENV, timeout_s=5.0
        )

    def test_missing_key_raises_clear_error(self):
        del os.environ[KEY_ENV]
        with self.assertRaisesRegex(CloudError, KEY_ENV):
            CloudASR(self.cfg)

    def test_transcribe_sends_wav_and_returns_text(self):
        asr = CloudASR(self.cfg, language="ru")
        segments = asr.transcribe(np.zeros(16000, dtype=np.float32))
        self.assertEqual(len(segments), 1)
        self.assertEqual(segments[0].text, " Привет, мир. ")
        req = self.server.last_request
        self.assertEqual(req["path"], "/v1/audio/transcriptions")
        self.assertEqual(req["auth"], "Bearer test-key-123")
        self.assertIn("multipart/form-data", req["content_type"])
        self.assertIn(b"RIFF", req["body"])  # WAV payload
        self.assertIn(b'name="model"', req["body"])
        self.assertIn(b'name="language"', req["body"])

    def test_http_error_raises_cloud_error(self):
        _Handler.status = 500
        asr = CloudASR(self.cfg)
        with self.assertRaisesRegex(CloudError, "500"):
            asr.transcribe(np.zeros(16000, dtype=np.float32))

    def test_unreachable_host_raises_cloud_error(self):
        self.cfg.base_url = "http://127.0.0.1:1/v1"  # nothing listens there
        asr = CloudASR(self.cfg)
        with self.assertRaisesRegex(CloudError, "Cannot reach"):
            asr.transcribe(np.zeros(16000, dtype=np.float32))


if __name__ == "__main__":
    unittest.main()
