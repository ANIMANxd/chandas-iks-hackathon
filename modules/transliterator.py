"""
Module 1: Transliterator
Handles Devanāgarī Unicode → IAST conversion and input normalization.
Uses indic-transliteration library as the core engine.
"""

import unicodedata
import re
from typing import Optional


# ── IAST character sets ────────────────────────────────────────────────────────

IAST_LONG_VOWELS = {'ā', 'ī', 'ū', 'ṝ', 'ē', 'ō'}
IAST_SHORT_VOWELS = {'a', 'i', 'u', 'ṛ', 'ḷ'}
IAST_DIPHTHONGS = {'e', 'ai', 'o', 'au'}   # treated as long in Chandas
IAST_ALL_VOWELS = IAST_LONG_VOWELS | IAST_SHORT_VOWELS | IAST_DIPHTHONGS

IAST_CONSONANTS = {
    'k', 'kh', 'g', 'gh', 'ṅ',
    'c', 'ch', 'j', 'jh', 'ñ',
    'ṭ', 'ṭh', 'ḍ', 'ḍh', 'ṇ',
    't', 'th', 'd', 'dh', 'n',
    'p', 'ph', 'b', 'bh', 'm',
    'y', 'r', 'l', 'v',
    'ś', 'ṣ', 's', 'h',
    'ḻ', 'kṣ', 'jñ'
}

ANUSVARA = 'ṃ'
VISARGA = 'ḥ'


# ── Main Transliterator class ──────────────────────────────────────────────────

class Transliterator:
    """
    Converts Sanskrit input to normalized IAST for downstream processing.
    Supports:
      - Devanāgarī Unicode input
      - IAST input (passthrough with normalization)
      - Harvard-Kyoto (HK) input
    """

    def __init__(self):
        self._has_indic = self._check_indic_library()

    def _check_indic_library(self) -> bool:
        try:
            from indic_transliteration import sanscript
            from indic_transliteration.sanscript import transliterate
            self._transliterate = transliterate
            self._sanscript = sanscript
            return True
        except ImportError:
            return False

    def to_iast(self, text: str, source_script: Optional[str] = None) -> str:
        """
        Convert input text to IAST.

        Args:
            text: Input Sanskrit text
            source_script: 'devanagari', 'iast', 'hk', or None (auto-detect)

        Returns:
            Normalized IAST string
        """
        text = text.strip()

        if source_script is None:
            source_script = self._detect_script(text)

        if source_script == 'iast':
            return self._normalize_iast(text)

        if source_script == 'devanagari':
            return self._devanagari_to_iast(text)

        if source_script == 'hk':
            return self._hk_to_iast(text)

        raise ValueError(f"Unsupported script: {source_script}")

    def _detect_script(self, text: str) -> str:
        """Auto-detect input script from Unicode ranges."""
        for char in text:
            cp = ord(char)
            # Devanāgarī block: U+0900–U+097F
            if 0x0900 <= cp <= 0x097F:
                return 'devanagari'
        # If it contains IAST diacritics, it's IAST
        iast_markers = ['ā', 'ī', 'ū', 'ṃ', 'ḥ', 'ṇ', 'ṭ', 'ḍ', 'ś', 'ṣ', 'ṝ', 'ṛ']
        for m in iast_markers:
            if m in text.lower():
                return 'iast'
        # Default: assume IAST-like ASCII (HK or simple)
        return 'iast'

    def _devanagari_to_iast(self, text: str) -> str:
        """Convert Devanāgarī to IAST using indic-transliteration."""
        if not self._has_indic:
            raise RuntimeError(
                "indic-transliteration not installed. "
                "Run: pip install indic-transliteration"
            )
        result = self._transliterate(
            text,
            self._sanscript.DEVANAGARI,
            self._sanscript.IAST
        )
        return self._normalize_iast(result)

    def _hk_to_iast(self, text: str) -> str:
        """Convert Harvard-Kyoto to IAST."""
        if not self._has_indic:
            raise RuntimeError(
                "indic-transliteration not installed. "
                "Run: pip install indic-transliteration"
            )
        result = self._transliterate(
            text,
            self._sanscript.HK,
            self._sanscript.IAST
        )
        return self._normalize_iast(result)

    def _normalize_iast(self, text: str) -> str:
        """
        Normalize IAST text:
        - Unicode NFC normalization
        - Lowercase (Chandas analysis is case-insensitive)
        - Strip punctuation except Sanskrit danda (।)
        - Collapse whitespace
        """
        # NFC: ensure composed forms (ā = single char, not a + combining macron)
        text = unicodedata.normalize('NFC', text)

        # Lowercase
        text = text.lower()

        # Remove non-Sanskrit punctuation (keep danda, space, IAST chars)
        # Keep: letters, IAST diacritics, space, danda
        text = re.sub(r'[^\w\s।ṃḥṇṭḍśṣṝṛḷāīūṅñ]', '', text, flags=re.UNICODE)

        # Devanagari words ending with halanta-m often transliterate as terminal 'm'.
        # For Chandas processing we normalize that to anusvara.
        text = re.sub(r'm\b', 'ṃ', text, flags=re.UNICODE)

        # Collapse multiple spaces
        text = re.sub(r'\s+', ' ', text).strip()

        return text

    def split_into_words(self, iast_text: str) -> list[str]:
        """Split normalized IAST text into words."""
        return iast_text.split()

    def is_devanagari(self, text: str) -> bool:
        return self._detect_script(text) == 'devanagari'

    def is_iast(self, text: str) -> bool:
        return self._detect_script(text) == 'iast'
