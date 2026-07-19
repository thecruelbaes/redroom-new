import os
import unittest

import numpy as np
from faster_whisper.audio import decode_audio

from fastwhisper.config import AppConfig
from fastwhisper.pipeline import Pipeline
from fastwhisper.postprocess import Segment
from fastwhisper.vad import SAMPLE_RATE

TESTDATA = os.path.join(os.path.dirname(__file__), "..", "testdata")


class FakeASR:
    def __init__(self, segments):
        self.segments = segments
        self.calls = 0

    def transcribe(self, audio):
        self.calls += 1
        return self.segments


class TestPipeline(unittest.TestCase):
    def test_silence_never_reaches_asr(self):
        asr = FakeASR([Segment("hallucinated text")])
        pipeline = Pipeline(AppConfig(), asr)
        result = pipeline.run(np.zeros(SAMPLE_RATE * 5, dtype=np.float32))
        self.assertFalse(result.speech_detected)
        self.assertEqual(result.text, "")
        self.assertEqual(asr.calls, 0)

    def test_speech_file_transcribed_and_filtered(self):
        audio = decode_audio(
            os.path.join(TESTDATA, "jfk_en.wav"), sampling_rate=SAMPLE_RATE
        )
        asr = FakeASR(
            [
                Segment("Ask not what your country can do for you."),
                Segment("Субтитры сделал DimaTorzok"),
            ]
        )
        result = Pipeline(AppConfig(), asr).run(audio)
        self.assertTrue(result.speech_detected)
        self.assertEqual(result.chunk_count, 1)  # 11s fits in one 30s chunk
        self.assertEqual(asr.calls, 1)
        self.assertEqual(result.text, "Ask not what your country can do for you.")

    def test_long_dictation_split_into_chunks(self):
        speech = decode_audio(
            os.path.join(TESTDATA, "jfk_en.wav"), sampling_rate=SAMPLE_RATE
        )
        pause = np.zeros(SAMPLE_RATE * 2, dtype=np.float32)
        # ~50s of audio: 4 utterances separated by 2s pauses
        audio = np.concatenate([speech, pause, speech, pause, speech, pause, speech])
        asr = FakeASR([Segment("part.")])
        result = Pipeline(AppConfig(), asr).run(audio)
        self.assertTrue(result.speech_detected)
        self.assertGreaterEqual(result.chunk_count, 2)
        self.assertEqual(asr.calls, result.chunk_count)
        # one text per chunk, joined with single spaces
        self.assertEqual(result.text, " ".join(["part."] * result.chunk_count))


if __name__ == "__main__":
    unittest.main()
