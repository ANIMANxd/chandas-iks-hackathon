"""
Module: STT Validator (Sarvam)
Provides speech-to-text transcription and character-level validation.
"""

import re

import requests


class STTValidator:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def transcribe(self, audio_path: str) -> str:
        """
        Send audio to Sarvam STT and return transcript text.
        """
        import os
        print(f"[STT] Attempting transcription of: {audio_path}")
        print(f"[STT] File exists: {os.path.exists(audio_path)}")
        print(f"[STT] API key present: {bool(self.api_key)}")
        
        try:
            import requests
            with open(audio_path, 'rb') as f:
                resp = requests.post(
                    'https://api.sarvam.ai/speech-to-text',
                    headers={'API-Subscription-Key': self.api_key},
                    files={'file': ('audio.wav', f, 'audio/wav')},
                    data={
                        'language_code': 'hi-IN',
                        'model': 'saarika:v2.5'
                    },
                    timeout=30
                )
            print(f"[STT] Response status: {resp.status_code}")
            print(f"[STT] Response body: {resp.text[:200]}")
            resp.raise_for_status()
            return resp.json().get('transcript', '')
        except Exception as e:
            print(f"[STT] Error: {e}")
            return None

    def compute_accuracy(
        self,
        original: str,
        transcribed: str
    ) -> dict:
        """
        Compare original Devanagari verse to STT output.
        Returns character-level match score.
        """

        def normalize(text: str) -> str:
            text = re.sub(r'[।॥\s,\.\-]', '', text)
            return text.strip()

        orig_clean = normalize(original)
        trans_clean = normalize(transcribed)

        matches = sum(
            1 for a, b in zip(orig_clean, trans_clean) if a == b
        )
        max_len = max(len(orig_clean), len(trans_clean), 1)
        accuracy = round(matches / max_len * 100, 1)

        return {
            'original_clean': orig_clean,
            'transcribed': transcribed,
            'transcribed_clean': trans_clean,
            'char_match_score': accuracy,
            'chars_matched': matches,
            'total_chars': max_len
        }
