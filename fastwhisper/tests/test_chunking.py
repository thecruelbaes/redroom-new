import unittest

from fastwhisper.chunking import split_into_chunks

SR = 16000


def sec(v: float) -> int:
    return int(v * SR)


class TestSplitIntoChunks(unittest.TestCase):
    def test_empty(self):
        self.assertEqual(split_into_chunks([], sec(30)), [])

    def test_single_short_segment(self):
        ts = [{"start": sec(1), "end": sec(5)}]
        self.assertEqual(split_into_chunks(ts, sec(30)), [(sec(1), sec(5))])

    def test_segments_merged_into_one_chunk(self):
        ts = [
            {"start": sec(0), "end": sec(10)},
            {"start": sec(12), "end": sec(25)},
        ]
        self.assertEqual(split_into_chunks(ts, sec(30)), [(sec(0), sec(25))])

    def test_split_at_pause_when_limit_exceeded(self):
        ts = [
            {"start": sec(0), "end": sec(20)},
            {"start": sec(22), "end": sec(40)},
        ]
        # 0..40 > 30s, so the chunk closes at the pause after 20s
        self.assertEqual(
            split_into_chunks(ts, sec(30)),
            [(sec(0), sec(20)), (sec(22), sec(40))],
        )

    def test_oversized_single_segment_hard_split(self):
        ts = [{"start": sec(0), "end": sec(70)}]
        self.assertEqual(
            split_into_chunks(ts, sec(30)),
            [(sec(0), sec(30)), (sec(30), sec(60)), (sec(60), sec(70))],
        )

    def test_oversized_segment_between_normal_ones(self):
        ts = [
            {"start": sec(0), "end": sec(5)},
            {"start": sec(10), "end": sec(75)},
            {"start": sec(80), "end": sec(85)},
        ]
        chunks = split_into_chunks(ts, sec(30))
        self.assertEqual(chunks[0], (sec(0), sec(5)))
        self.assertEqual(chunks[1], (sec(10), sec(40)))
        self.assertEqual(chunks[2], (sec(40), sec(70)))
        # tail of the oversized segment merges with the following segment (85-70=15s < 30s)
        self.assertEqual(chunks[3], (sec(70), sec(85)))

    def test_chunks_cover_all_speech_in_order(self):
        ts = [{"start": sec(i * 10), "end": sec(i * 10 + 8)} for i in range(10)]
        chunks = split_into_chunks(ts, sec(30))
        self.assertEqual(chunks[0][0], ts[0]["start"])
        self.assertEqual(chunks[-1][1], ts[-1]["end"])
        for (s1, e1), (s2, e2) in zip(chunks, chunks[1:]):
            self.assertLess(s1, e1)
            self.assertLessEqual(e1, s2)
        for _, (s, e) in enumerate(chunks):
            self.assertLessEqual(e - s, sec(30))

    def test_invalid_max_len(self):
        with self.assertRaises(ValueError):
            split_into_chunks([], 0)


if __name__ == "__main__":
    unittest.main()
