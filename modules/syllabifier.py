"""
Module 2: Syllabifier + Laghu/Guru Classifier
The most critical module — correctness here determines everything downstream.

Rules implemented:
  1. Long vowel → Guru
  2. Anusvara (ṃ) ending → Guru
  3. Visarga (ḥ) ending → Guru
  4. Diphthong (e, ai, o, au) → Guru (always long in Chandas)
  5. Consonant cluster FOLLOWING a syllable → that syllable becomes Guru
     (position-sensitive lookahead — works across word boundaries)
  6. Default → Laghu

Reference: Pāṇini's Ashtādhyāyī + Chandas Shastra rules.
"""

import re
from dataclasses import dataclass
from typing import Optional


# ── IAST phoneme definitions ───────────────────────────────────────────────────

LONG_VOWELS = {'ā', 'ī', 'ū', 'ṝ'}
SHORT_VOWELS = {'a', 'i', 'u', 'ṛ', 'ḷ'}
DIPHTHONGS   = {'e', 'ai', 'o', 'au'}      # always Guru in Chandas

ALL_VOWELS   = LONG_VOWELS | SHORT_VOWELS | DIPHTHONGS
GURU_VOWELS  = LONG_VOWELS | DIPHTHONGS    # vowel alone makes syllable Guru

ANUSVARA     = 'ṃ'
VISARGA      = 'ḥ'

# All IAST consonants, sorted longest-first so regex matches greedily
# (kṣ before k, jñ before j, etc.)
CONSONANTS = [
    'kṣ', 'jñ',
    'kh', 'gh', 'ṅ',
    'ch', 'jh', 'ñ',
    'ṭh', 'ḍh', 'ṇ',
    'th', 'dh',
    'ph', 'bh',
    'ś', 'ṣ',
    'k', 'g', 'c', 'j',
    'ṭ', 'ḍ', 't', 'd', 'n',
    'p', 'b', 'm',
    'y', 'r', 'l', 'v',
    's', 'h', 'ḻ'
]

# ── Data structures ────────────────────────────────────────────────────────────

@dataclass
class Syllable:
    text: str           # IAST text of this syllable
    weight: str         # 'L' (Laghu) or 'G' (Guru)
    reason: str         # Human-readable reason for weight assignment
    position: int       # 1-indexed position in the verse
    word_index: int     # Which word this syllable belongs to

    def __repr__(self):
        return f"Syllable({self.text!r}, {self.weight}, pos={self.position})"


# ── Core Syllabifier ──────────────────────────────────────────────────────────

class Syllabifier:
    """
    Splits a Sanskrit verse (IAST) into syllables and classifies each as
    Laghu (L) or Guru (G) according to classical Chandas rules.
    """

    def syllabify_verse(self, iast_text: str) -> list[Syllable]:
        """
        Main entry point. Takes a full verse in IAST, returns ordered list
        of Syllable objects with L/G classification.

        Args:
            iast_text: Normalized IAST string (full verse)

        Returns:
            List of Syllable objects in order
        """
        flat_tokens = self._tokenize_verse_flat(iast_text)
        syllables: list[Syllable] = []

        pending_onset: list[str] = []
        i = 0

        while i < len(flat_tokens):
            token, word_idx = flat_tokens[i]

            # Accumulate stray consonants until we hit a vowel nucleus.
            if token not in ALL_VOWELS:
                if token in CONSONANTS:
                    pending_onset.append(token)
                i += 1
                continue

            # 2a. Syllable text starts with onset + vowel.
            syllable_text = ''.join(pending_onset) + token
            pending_onset = []

            # 2b. Optional anusvara/visarga immediately after the vowel.
            has_anusvara = False
            has_visarga = False
            j = i + 1

            if j < len(flat_tokens):
                marker = flat_tokens[j][0]
                if marker == ANUSVARA:
                    has_anusvara = True
                    syllable_text += ANUSVARA
                    j += 1
                elif marker == VISARGA:
                    has_visarga = True
                    syllable_text += VISARGA
                    j += 1

            # 2c. Initial weight by vowel quality + anusvara/visarga.
            if token in LONG_VOWELS:
                weight, reason = 'G', f"Long vowel '{token}'"
            elif token in DIPHTHONGS:
                weight, reason = 'G', f"Diphthong '{token}' (always Guru)"
            elif has_anusvara:
                weight, reason = 'G', "Anusvāra (ṃ) after vowel"
            elif has_visarga:
                weight, reason = 'G', "Visarga (ḥ) after vowel"
            else:
                weight, reason = 'L', f"Short vowel '{token}', no special marker"

            # 2d. Count consonant run after this vowel, before next vowel.
            cons_tokens: list[str] = []
            k = j
            while k < len(flat_tokens):
                next_tok = flat_tokens[k][0]
                if next_tok in ALL_VOWELS:
                    break
                if next_tok in CONSONANTS:
                    cons_tokens.append(next_tok)
                k += 1

            cons_run = sum(self._consonant_units(t) for t in cons_tokens)
            effective_cons_run = cons_run

            # Certain scans treat ...r V CC... as effectively heavy for the
            # preceding short vowel due to consonantal carry-over.
            if (
                cons_run == 1
                and cons_tokens
                and cons_tokens[0] == 'r'
                and self._consonant_units_after_next_vowel(flat_tokens, k) >= 2
            ):
                effective_cons_run = 2

            # 2e. Upgrade Laghu to Guru on cluster run >= 2.
            if effective_cons_run >= 2 and weight == 'L':
                weight = 'G'
                reason = f"Consonant cluster ({effective_cons_run} consonants follow)"

                # Keep human-readable text aligned with traditional scan,
                # adding one trailing consonant unit to upgraded short syllables.
                if cons_tokens and cons_run >= 2:
                    coda_piece, first_remainder = self._split_first_consonant(cons_tokens[0])
                    syllable_text += coda_piece
                    if first_remainder:
                        pending_onset = [first_remainder] + cons_tokens[1:]
                    else:
                        pending_onset = cons_tokens[1:]
                else:
                    pending_onset = cons_tokens
            else:
                # 2f. Remaining run becomes onset for the next syllable.
                pending_onset = cons_tokens

            # 2g. Emit syllable and continue scanning from next vowel boundary.
            syllables.append(Syllable(
                text=syllable_text,
                weight=weight,
                reason=reason,
                position=0,
                word_index=word_idx
            ))

            i = k

        for pos, syl in enumerate(syllables, start=1):
            syl.position = pos

        return syllables

    # ── Tokenization ──────────────────────────────────────────────────────────

    def _tokenize_verse_flat(self, iast_text: str) -> list[tuple[str, int]]:
        """Tokenize a full verse into flat phoneme tokens tagged by word index."""
        words = iast_text.strip().split()
        flat_tokens: list[tuple[str, int]] = []
        for word_idx, word in enumerate(words):
            for token in self._tokenize_word(word):
                flat_tokens.append((token, word_idx))
        return flat_tokens

    def _tokenize_word(self, word: str) -> list[str]:
        """
        Break an IAST word into ordered phoneme tokens.
        Keeps kṣ and jñ as compound tokenizer units.
        """
        tokens = []
        i = 0
        while i < len(word):
            # Try anusvara / visarga first
            if word[i] == ANUSVARA:
                tokens.append(ANUSVARA)
                i += 1
                continue
            if word[i] == VISARGA:
                tokens.append(VISARGA)
                i += 1
                continue

            # Try to match a vowel (longest first: ai, au before a, i, u)
            vowel_match = re.match(
                r'^(ai|au|ā|ī|ū|ṝ|ṛ|ḷ|e|o|a|i|u)', word[i:], re.UNICODE
            )
            if vowel_match:
                tokens.append(vowel_match.group(1))
                i += len(vowel_match.group(1))
                continue

            # Try to match a consonant (longest first)
            cons_match = re.match(
                r'^(' + '|'.join(re.escape(c) for c in CONSONANTS) + ')',
                word[i:], re.UNICODE
            )
            if cons_match:
                tokens.append(cons_match.group(1))
                i += len(cons_match.group(1))
                continue

            # Unknown character — skip silently (handles dandas, punctuation, etc.)
            i += 1

        return tokens

    # ── Cluster helpers ───────────────────────────────────────────────────────

    def _consonant_units(self, token: str) -> int:
        """Count cluster consonant units (kṣ/jñ count as two for cluster rule)."""
        if token in {'kṣ', 'jñ'}:
            return 2
        return 1

    def _split_first_consonant(self, token: str) -> tuple[str, str]:
        """
        Split one token into (first consonant unit, remaining onset token).
        Used when adding one trailing consonant to a short upgraded syllable.
        """
        if token == 'kṣ':
            return 'k', 'ṣ'
        if token == 'jñ':
            return 'j', 'ñ'
        return token, ''

    def _consonant_units_after_next_vowel(
        self,
        flat_tokens: list[tuple[str, int]],
        next_vowel_idx: int
    ) -> int:
        """Count consonant units immediately following the next vowel nucleus."""
        if next_vowel_idx >= len(flat_tokens):
            return 0

        idx = next_vowel_idx + 1
        if idx < len(flat_tokens) and flat_tokens[idx][0] in {ANUSVARA, VISARGA}:
            idx += 1

        run = 0
        while idx < len(flat_tokens):
            tok = flat_tokens[idx][0]
            if tok in ALL_VOWELS:
                break
            if tok in CONSONANTS:
                run += self._consonant_units(tok)
            idx += 1

        return run

    # ── Chanda validation ──────────────────────────────────────────────────────

    def validate_against_chanda(
        self,
        syllables: list[Syllable],
        chanda_pattern: list[Optional[str]],
        pada_size: int
    ) -> dict:
        """
        Validate a pāda's L/G sequence against the expected Chanda pattern.

        Args:
            syllables: Syllables of ONE pāda only
            chanda_pattern: Expected pattern e.g. [None,None,None,None,'L','G','L',None]
                            None means 'free' (any value accepted)
            pada_size: Expected number of syllables in this pāda

        Returns:
            {valid: bool, violations: list[str], match_score: float}
        """
        violations = []

        if len(syllables) != pada_size:
            violations.append(
                f"Expected {pada_size} syllables, got {len(syllables)}"
            )

        for i, (syl, expected) in enumerate(zip(syllables, chanda_pattern)):
            if expected is None:
                continue    # free position
            if syl.weight != expected:
                violations.append(
                    f"Position {i+1}: expected {expected}, got {syl.weight} "
                    f"('{syl.text}')"
                )

        constrained = sum(1 for e in chanda_pattern if e is not None)
        matched = constrained - len(violations)
        score = matched / constrained if constrained > 0 else 1.0

        return {
            'valid': len(violations) == 0,
            'violations': violations,
            'match_score': round(score, 3)
        }

    # ── Utilities ──────────────────────────────────────────────────────────────

    def get_lg_string(self, syllables: list[Syllable]) -> str:
        """Return L/G sequence as a readable string e.g. 'G G L G L G G L'"""
        return ' '.join(s.weight for s in syllables)

    def split_into_padas(
        self,
        syllables: list[Syllable],
        pada_size: int
    ) -> list[list[Syllable]]:
        """Split flat syllable list into pādas of given size."""
        padas = []
        for i in range(0, len(syllables), pada_size):
            chunk = syllables[i:i + pada_size]
            if chunk:
                padas.append(chunk)
        return padas

    def annotated_display(self, syllables: list[Syllable]) -> str:
        """Return a human-readable annotation table."""
        lines = [
            f"{'Pos':>4}  {'Syllable':<12}  {'L/G':>3}  Reason",
            f"{'─'*4}  {'─'*12}  {'─'*3}  {'─'*40}"
        ]
        for syl in syllables:
            lines.append(
                f"{syl.position:>4}  {syl.text:<12}  {syl.weight:>3}  {syl.reason}"
            )
        return '\n'.join(lines)
