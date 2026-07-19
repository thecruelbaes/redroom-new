import unittest

from fastwhisper.postprocess import (
    Segment,
    filter_segments,
    is_hallucination,
    join_texts,
)


class TestIsHallucination(unittest.TestCase):
    def test_youtube_subtitle_artifacts_ru(self):
        self.assertTrue(is_hallucination("Субтитры сделал DimaTorzok"))
        self.assertTrue(is_hallucination("Редактор субтитров А.Семкин Корректор А.Егорова"))
        self.assertTrue(is_hallucination("Продолжение следует..."))
        self.assertTrue(is_hallucination("Спасибо за просмотр!"))
        self.assertTrue(is_hallucination("ПОДПИСЫВАЙТЕСЬ НА КАНАЛ"))

    def test_youtube_subtitle_artifacts_en(self):
        self.assertTrue(is_hallucination("Thanks for watching!"))
        self.assertTrue(is_hallucination("Subtitles by the Amara.org community"))
        self.assertTrue(is_hallucination("Please subscribe"))

    def test_empty_and_punctuation_only(self):
        self.assertTrue(is_hallucination(""))
        self.assertTrue(is_hallucination("  ...  "))

    def test_normal_text_kept(self):
        self.assertFalse(is_hallucination("Привет, это тестовая диктовка."))
        self.assertFalse(is_hallucination("Hello, this is a test dictation."))
        # contains a keyword only as part of a real sentence about subtitles?
        # exact-phrase entries must not match longer real sentences
        self.assertFalse(is_hallucination("Спасибо за просмотр моего отчета, коллеги, продолжим завтра."))


class TestFilterSegments(unittest.TestCase):
    def test_drops_hallucinated_segment(self):
        segs = [
            Segment("Привет мир"),
            Segment("Субтитры сделал DimaTorzok"),
        ]
        kept = filter_segments(segs)
        self.assertEqual([s.text for s in kept], ["Привет мир"])

    def test_drops_low_confidence_no_speech(self):
        segs = [Segment("бла бла", avg_logprob=-1.5, no_speech_prob=0.9)]
        self.assertEqual(filter_segments(segs), [])

    def test_keeps_confident_segment_despite_no_speech_prob(self):
        segs = [Segment("нормальный текст", avg_logprob=-0.2, no_speech_prob=0.7)]
        self.assertEqual(len(filter_segments(segs)), 1)


class TestJoinTexts(unittest.TestCase):
    def test_joins_with_single_space(self):
        self.assertEqual(join_texts(["Привет,", "мир."]), "Привет, мир.")

    def test_skips_empty_and_collapses_whitespace(self):
        self.assertEqual(join_texts([" a ", "", "  b  c "]), "a b c")

    def test_empty_input(self):
        self.assertEqual(join_texts([]), "")


if __name__ == "__main__":
    unittest.main()
