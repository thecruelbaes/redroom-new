"""Splitting VAD speech timestamps into ASR-sized chunks at pauses."""


def split_into_chunks(
    speech_timestamps: list[dict], max_chunk_len: int
) -> list[tuple[int, int]]:
    """Group speech segments into chunks no longer than max_chunk_len samples.

    Boundaries always fall on VAD-detected pauses, except for a single
    speech segment longer than the limit, which is hard-split.
    Returns (start, end) sample ranges covering speech and internal pauses.
    """
    if max_chunk_len <= 0:
        raise ValueError("max_chunk_len must be positive")
    chunks: list[tuple[int, int]] = []
    cur_start: int | None = None
    cur_end = 0
    for seg in speech_timestamps:
        start, end = seg["start"], seg["end"]
        if end - start > max_chunk_len:
            if cur_start is not None:
                chunks.append((cur_start, cur_end))
                cur_start = None
            while end - start > max_chunk_len:
                chunks.append((start, start + max_chunk_len))
                start += max_chunk_len
            cur_start, cur_end = start, end
        elif cur_start is None:
            cur_start, cur_end = start, end
        elif end - cur_start <= max_chunk_len:
            cur_end = end
        else:
            chunks.append((cur_start, cur_end))
            cur_start, cur_end = start, end
    if cur_start is not None:
        chunks.append((cur_start, cur_end))
    return chunks
