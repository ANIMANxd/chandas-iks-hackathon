"""
Module 5: Prosody Modifier
Utility audio concatenation helpers.
"""

import os
import tempfile
import numpy as np
from typing import Optional

try:
    import soundfile as sf
    HAS_SOUNDFILE = True
except ImportError:
    HAS_SOUNDFILE = False


# ── Prosody Modifier ──────────────────────────────────────────────────────────

class ProsodyModifier:
    """Audio utility class kept for compatibility and helper usage."""

    SAMPLE_RATE = 22050

    def __init__(self, output_dir: str = 'outputs'):
        self._output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        self._temp_dir = tempfile.mkdtemp(prefix='chanda_prosody_')

    def concatenate_with_gaps(
        self,
        segments: list[np.ndarray],
        gap_ms: float = 25,
        output_filename: str = 'output.wav'
    ) -> str:
        """Concatenate in-memory segments with fixed gaps and save output."""
        output_path = os.path.join(self._output_dir, output_filename)

        if not segments:
            self._write_silence(output_path, 1000)
            return output_path

        gap = self._make_silence(gap_ms, self.SAMPLE_RATE)
        pieces = []
        for i, seg in enumerate(segments):
            pieces.append(seg.astype(np.float32))
            if i < len(segments) - 1:
                pieces.append(gap)

        merged = np.concatenate(pieces).astype(np.float32)
        peak = np.max(np.abs(merged))
        if peak > 0:
            merged = merged / peak * 0.9

        self._write_wav(output_path, merged, self.SAMPLE_RATE)
        return output_path

    # ── Concatenation ──────────────────────────────────────────────────────────

    def _concatenate(self, segment_paths: list[str], output_path: str, gap_ms: float = 30):
        """
        Concatenate a list of .wav segments into one output .wav.
        All segments normalized to the same sample rate before joining.
        Adds a short silence gap between syllables for natural rhythm.
        """
        all_samples = []
        gap_samples = self._make_silence(duration_ms=gap_ms, sr=self.SAMPLE_RATE)

        for i, path in enumerate(segment_paths):
            samples, sr = self._load_wav(path)
            if samples is None:
                continue

            # Resample to standard rate if needed
            if sr != self.SAMPLE_RATE:
                samples = self._resample(samples, sr, self.SAMPLE_RATE)

            all_samples.append(samples)

            # Add inter-syllable gap (not after the last syllable)
            if i < len(segment_paths) - 1:
                all_samples.append(gap_samples)

        if not all_samples:
            self._write_silence(output_path, 1000)
            return

        concatenated = np.concatenate(all_samples).astype(np.float32)

        # Normalize to prevent clipping
        peak = np.max(np.abs(concatenated))
        if peak > 0:
            concatenated = concatenated / peak * 0.9

        self._write_wav(output_path, concatenated, self.SAMPLE_RATE)

    # ── Audio I/O utilities ────────────────────────────────────────────────────

    def _load_wav(self, path: str) -> tuple[Optional[np.ndarray], int]:
        """Load a .wav file. Returns (samples as float32, sample_rate)."""
        if not os.path.exists(path):
            return None, self.SAMPLE_RATE

        if HAS_SOUNDFILE:
            try:
                samples, sr = sf.read(path, dtype='float32')
                if samples.ndim > 1:
                    samples = samples.mean(axis=1)  # stereo → mono
                return samples, sr
            except Exception:
                pass

        # Pure stdlib fallback
        import wave
        try:
            with wave.open(path, 'r') as wf:
                sr = wf.getframerate()
                frames = wf.readframes(wf.getnframes())
                samples = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
                return samples, sr
        except Exception:
            return None, self.SAMPLE_RATE

    def _write_wav(self, path: str, samples: np.ndarray, sr: int):
        """Write float32 numpy array as a WAV file."""
        if HAS_SOUNDFILE:
            sf.write(path, samples, sr)
            return

        import wave
        int_samples = (samples * 32767).astype(np.int16)
        with wave.open(path, 'w') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sr)
            wf.writeframes(int_samples.tobytes())

    def _write_silence(self, path: str, duration_ms: float):
        """Write a silence segment."""
        silence = self._make_silence(duration_ms, self.SAMPLE_RATE)
        self._write_wav(path, silence, self.SAMPLE_RATE)

    def _make_silence(self, duration_ms: float, sr: int) -> np.ndarray:
        """Return a silence array of given duration."""
        n = int(sr * duration_ms / 1000.0)
        return np.zeros(n, dtype=np.float32)

    def _resample(self, samples: np.ndarray, from_sr: int, to_sr: int) -> np.ndarray:
        """Simple linear resampling between sample rates."""
        if from_sr == to_sr:
            return samples
        num_new = int(len(samples) * to_sr / from_sr)
        old_idx = np.linspace(0, len(samples) - 1, len(samples))
        new_idx = np.linspace(0, len(samples) - 1, num_new)
        return np.interp(new_idx, old_idx, samples).astype(np.float32)

    def cleanup(self):
        import shutil
        if os.path.exists(self._temp_dir):
            shutil.rmtree(self._temp_dir)

    def __del__(self):
        try:
            self.cleanup()
        except Exception:
            pass
