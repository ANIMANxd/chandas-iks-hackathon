"""
Module 4: TTS Engine
Simplified full-verse Sarvam AI synthesis.
"""

import base64
import os
import tempfile
import wave
from dataclasses import dataclass

import numpy as np

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

try:
    import soundfile as sf
    HAS_SOUNDFILE = True
except ImportError:
    HAS_SOUNDFILE = False


@dataclass
class AudioSegmentResult:
    syllable_text: str
    audio_path: str
    sample_rate: int
    duration_ms: float


class TTSEngine:
    """Full-verse Sarvam-backed TTS with tone fallback for resilience."""

    SAMPLE_RATE = 22050
    API_URL = "https://api.sarvam.ai/text-to-speech"

    def __init__(self, voice: str = "sa", speed: int = 100, api_key: str | None = None):
        # Keep voice/speed args for backward compatibility with callers.
        self.voice = voice
        self.speed = speed
        from dotenv import load_dotenv
        from pathlib import Path
        load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / '.env', override=True)
        self.api_key = api_key or os.getenv("SARVAM_API_KEY")
        self._temp_dir = tempfile.mkdtemp(prefix="chanda_tts_")

    def synthesize_full_verse_sarvam(
        self,
        devanagari_text: str,
        pace: float = 0.75,
        pitch: int = 0
    ) -> str:
        """Synthesize full verse in one Sarvam API call and return wav path."""
        out_path = os.path.join(self._temp_dir, "full_verse.wav")
        text_to_send = devanagari_text
        ok = self._sarvam_synthesize_text(text_to_send, out_path, pace=pace, pitch=pitch)
        if not ok:
            self._tone_fallback(text_to_send, out_path, duration_ms=2500)
        return out_path

    def synthesize_full_verse_raw(self, iast_text: str) -> str:
        """Backward-compatible alias used by older call sites."""
        return self.synthesize_full_verse_sarvam(devanagari_text=iast_text)

    def _sarvam_synthesize_text(
        self,
        text: str,
        output_path: str,
        pace: float,
        pitch: int,
    ) -> bool:
        if not self.api_key or not HAS_REQUESTS:
            return False

        headers = {
            "API-Subscription-Key": self.api_key,
            "Content-Type": "application/json",
        }
        payload = {
            "inputs": [text],
            "target_language_code": "hi-IN",
            "speaker": "manisha",
            "pitch": pitch,
            "pace": pace,
            "loudness": 1.5,
            "speech_sample_rate": 22050,
            "enable_preprocessing": False,
            "model": "bulbul:v2",
        }

        try:
            response = requests.post(self.API_URL, headers=headers, json=payload, timeout=45)
            response.raise_for_status()
            body = response.json()
            audio_b64 = body.get("audios", [None])[0]
            if not audio_b64:
                return False
            wav_bytes = base64.b64decode(audio_b64)
            with open(output_path, "wb") as f:
                f.write(wav_bytes)
            return True
        except Exception:
            return False

    def _tone_fallback(self, text: str, output_path: str, duration_ms: float = 2500):
        vowel_freqs = {
            "a": 440, "ā": 440,
            "i": 528, "ī": 528,
            "u": 396, "ū": 396,
            "e": 495, "ai": 495,
            "o": 417, "au": 417,
        }

        freq = 440
        for vowel, value in vowel_freqs.items():
            if vowel in text:
                freq = value
                break

        num_samples = int(self.SAMPLE_RATE * duration_ms / 1000.0)
        t = np.linspace(0, duration_ms / 1000.0, num_samples, endpoint=False)
        wave_data = np.sin(2 * np.pi * freq * t).astype(np.float32) * 0.5

        fade_samples = min(int(self.SAMPLE_RATE * 0.005), max(1, num_samples // 4))
        fade_in = np.linspace(0, 1, fade_samples)
        fade_out = np.linspace(1, 0, fade_samples)
        wave_data[:fade_samples] *= fade_in
        wave_data[-fade_samples:] *= fade_out

        self._write_wav(output_path, wave_data, self.SAMPLE_RATE)

    def _write_wav(self, path: str, samples: np.ndarray, sample_rate: int):
        if HAS_SOUNDFILE:
            sf.write(path, samples.astype(np.float32), sample_rate)
            return

        int_samples = (samples * 32767).astype(np.int16)
        with wave.open(path, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(int_samples.tobytes())

    def cleanup(self):
        import shutil

        if os.path.exists(self._temp_dir):
            shutil.rmtree(self._temp_dir)

    def __del__(self):
        try:
            self.cleanup()
        except Exception:
            pass

    @property
    def is_espeak_available(self) -> bool:
        # Compatibility property retained for existing call sites.
        return bool(self.api_key)

    @property
    def mode(self) -> str:
        return "sarvam-ai" if self.api_key else "tone-fallback"
