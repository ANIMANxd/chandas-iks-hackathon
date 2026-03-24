"""
Module 3: Prosody Planner
Maps the L/G sequence from the Syllabifier to:
  - Duration multipliers (L=1x, G=2x base unit)
  - Pitch values (Hz) per syllable from the selected melodic model

Two melodic models:
  1. Vedic 3-level: Anudātta / Svarita / Udātta
  2. Rāga Bhairavī: Ārohā-avarohā contour mapping
"""

from dataclasses import dataclass
from typing import Literal
from .syllabifier import Syllable


# ── Data structures ────────────────────────────────────────────────────────────

MelodicMode = Literal['vedic', 'raga_bhairavi']

@dataclass
class PlannedSyllable:
    syllable: Syllable          # Original syllable with L/G
    duration_ms: float          # Target duration in milliseconds
    pitch_hz: float             # Target pitch in Hz
    pitch_label: str            # Human-readable pitch label

    def __repr__(self):
        return (
            f"PlannedSyllable({self.syllable.text!r}, "
            f"{self.syllable.weight}, "
            f"dur={self.duration_ms:.0f}ms, "
            f"pitch={self.pitch_hz:.1f}Hz)"
        )


# ── Prosody Planner ────────────────────────────────────────────────────────────

class ProsodyPlanner:
    """
    Given a list of Syllable objects and user selections, produce
    a PlannedSyllable list with duration_ms and pitch_hz per syllable.
    """

    # Base duration unit in ms. Laghu = 1× = 150ms, Guru = 2× = 300ms.
    # These values match the approximate mātrā timing in classical recitation.
    BASE_MATRA_MS = 150.0

    def __init__(self, base_pitch_hz: float = 200.0):
        """
        Args:
            base_pitch_hz: Speaker's neutral/comfortable pitch.
                           Female: ~220Hz, Male: ~120Hz, Neutral default: 200Hz
        """
        self.base_pitch = base_pitch_hz

    def plan(
        self,
        syllables: list[Syllable],
        melodic_mode: MelodicMode = 'vedic',
        chanda: str = 'anushtubh'
    ) -> list[PlannedSyllable]:
        """
        Main planning function.

        Args:
            syllables: L/G-classified syllables from Syllabifier
            melodic_mode: 'vedic' or 'raga_bhairavi'
            chanda: Used to determine pada structure for pitch assignment

        Returns:
            List of PlannedSyllable objects
        """
        durations = self._plan_durations(syllables)
        pitches = self._plan_pitch(syllables, melodic_mode, chanda)

        return [
            PlannedSyllable(
                syllable=syl,
                duration_ms=dur,
                pitch_hz=pitch['hz'],
                pitch_label=pitch['label']
            )
            for syl, dur, pitch in zip(syllables, durations, pitches)
        ]

    # ── Duration planning ──────────────────────────────────────────────────────

    def _plan_durations(self, syllables: list[Syllable]) -> list[float]:
        """
        L → 1 mātrā = BASE_MATRA_MS
        G → 2 mātrā = BASE_MATRA_MS × 2
        """
        durations = []
        for syl in syllables:
            if syl.weight == 'G':
                durations.append(self.BASE_MATRA_MS * 2.0)
            else:
                durations.append(self.BASE_MATRA_MS * 1.0)
        return durations

    # ── Pitch planning ─────────────────────────────────────────────────────────

    def _plan_pitch(
        self,
        syllables: list[Syllable],
        mode: MelodicMode,
        chanda: str
    ) -> list[dict]:
        """
        Dispatch to the appropriate melodic model.
        Returns list of {hz, label} dicts.
        """
        if mode == 'vedic':
            return self._vedic_pitch(syllables, chanda)
        elif mode == 'raga_bhairavi':
            return self._bhairavi_pitch(syllables, chanda)
        else:
            raise ValueError(f"Unknown melodic mode: {mode}")

    def _vedic_pitch(
        self,
        syllables: list[Syllable],
        chanda: str
    ) -> list[dict]:
        """
        Vedic 3-level pitch accent system:
          Anudātta  (low)  = base × 0.85
          Svarita   (mid)  = base × 1.00
          Udātta    (high) = base × 1.20

        Anushtubh traditional contour per pāda (8 syllables):
          Odd pādas:  [mid, mid, mid, mid, low, high, mid, low]
          Even pādas: [mid, mid, mid, mid, low, high, high, low]

        For longer Chandas (Mandākrāntā etc.), use a normalized envelope.
        """
        RATIOS = {
            'anudatta': 0.85,
            'svarita':  1.00,
            'udatta':   1.20
        }

        # Anushtubh contour (8 syllables per pāda)
        ANUSTUBH_ODD_CONTOUR  = ['svarita','svarita','svarita','svarita',
                                   'anudatta','udatta','svarita','anudatta']
        ANUSTUBH_EVEN_CONTOUR = ['svarita','svarita','svarita','svarita',
                                   'anudatta','udatta','udatta','anudatta']

        pada_size = 8 if chanda == 'anushtubh' else 17

        result = []
        for i, syl in enumerate(syllables):
            pada_num = (i // pada_size) + 1     # 1-indexed
            pos_in_pada = i % pada_size          # 0-indexed

            if chanda == 'anushtubh':
                contour = (ANUSTUBH_ODD_CONTOUR
                           if pada_num % 2 == 1
                           else ANUSTUBH_EVEN_CONTOUR)
                label = contour[pos_in_pada] if pos_in_pada < len(contour) else 'svarita'
            else:
                # Generic envelope for other Chandas: arch shape
                label = self._arch_envelope(pos_in_pada, pada_size)

            hz = self.base_pitch * RATIOS[label]
            result.append({'hz': round(hz, 2), 'label': label})

        return result

    def _bhairavi_pitch(
        self,
        syllables: list[Syllable],
        chanda: str
    ) -> list[dict]:
        """
        Rāga Bhairavī pitch mapping.

        Bhairavī scale (using komal/flat variants):
          Sa  Re♭  Ga♭  Ma  Pa  Dha♭  Ni♭  Sā

        Frequency ratios relative to Sa (base pitch):
          Sa=1.000, Re♭=1.067, Ga♭=1.185, Ma=1.333,
          Pa=1.500, Dha♭=1.600, Ni♭=1.778, Sā=2.000

        Strategy:
          - First half of pāda: ascending (ārohā)
          - Second half of pāda: descending (avarohā)
          This gives a natural arch that fits Sanskrit verse phrasing.
        """
        BHAIRAVI_RATIOS = [1.000, 1.067, 1.185, 1.333, 1.500, 1.600, 1.778, 2.000]
        BHAIRAVI_NAMES  = ['Sa', 'Re♭', 'Ga♭', 'Ma', 'Pa', 'Dha♭', 'Ni♭', 'Sā']

        pada_size = 8 if chanda == 'anushtubh' else 17

        result = []
        for i, syl in enumerate(syllables):
            pos_in_pada = i % pada_size
            half = pada_size // 2

            if pos_in_pada < half:
                # Ascending — map position to ārohā
                idx = int((pos_in_pada / half) * (len(BHAIRAVI_RATIOS) - 1))
            else:
                # Descending — map position to avarohā
                desc_pos = pos_in_pada - half
                desc_len = pada_size - half
                idx = int(((desc_len - desc_pos) / desc_len) * (len(BHAIRAVI_RATIOS) - 1))

            idx = max(0, min(idx, len(BHAIRAVI_RATIOS) - 1))
            ratio = BHAIRAVI_RATIOS[idx]
            label = BHAIRAVI_NAMES[idx]

            # Guru syllables get slightly higher emphasis (×1.03)
            if syl.weight == 'G':
                ratio *= 1.03

            hz = self.base_pitch * ratio
            result.append({'hz': round(hz, 2), 'label': label})

        return result

    def _arch_envelope(self, position: int, total: int) -> str:
        """Generic arch pitch envelope for arbitrary Chanda lengths."""
        normalized = position / max(total - 1, 1)
        if normalized < 0.15:
            return 'anudatta'
        elif normalized < 0.45:
            return 'svarita'
        elif normalized < 0.55:
            return 'udatta'
        elif normalized < 0.85:
            return 'svarita'
        else:
            return 'anudatta'

    # ── Utilities ──────────────────────────────────────────────────────────────

    def get_timing_table(self, planned: list[PlannedSyllable]) -> str:
        """Human-readable timing + pitch table."""
        lines = [
            f"{'Pos':>4}  {'Text':<12}  {'L/G':>3}  {'Duration':>10}  {'Pitch (Hz)':>10}  Label",
            f"{'─'*4}  {'─'*12}  {'─'*3}  {'─'*10}  {'─'*10}  {'─'*15}"
        ]
        for i, p in enumerate(planned):
            lines.append(
                f"{i+1:>4}  {p.syllable.text:<12}  {p.syllable.weight:>3}  "
                f"{p.duration_ms:>8.0f}ms  {p.pitch_hz:>10.1f}  {p.pitch_label}"
            )
        total_ms = sum(p.duration_ms for p in planned)
        lines.append(f"\nTotal duration: {total_ms:.0f}ms ({total_ms/1000:.2f}s)")
        return '\n'.join(lines)

    def total_duration_ms(self, planned: list[PlannedSyllable]) -> float:
        return sum(p.duration_ms for p in planned)

    def get_yati_marked_devanagari(
        self,
        original_devanagari: str,
        chanda: str
    ) -> str:
        """
        Insert yati pause markers into the Devanagari text for the given Chanda.

        Yati positions (syllable boundaries):
        - anushtubh: after every 8 syllables (pada end) with danda
        - mandakranta: conceptual mid-pada pauses with comma and danda at pada end
        - shardulavikridita: pause after syllable 12, then pada end
        """
        text = original_devanagari.strip()

        if chanda == 'anushtubh':
            # Preserve existing danda if already present.
            normalized = text.replace('॥', '।').replace('।।', '।')
            if '।' in normalized:
                return normalized

            words = normalized.split()
            if not words:
                return normalized
            mid = len(words) // 2
            words.insert(mid, '।')
            return ' '.join(words)

        if chanda == 'mandakranta':
            normalized = text.replace('॥', '।').replace('।।', '।')
            if '।' in normalized:
                return normalized
            words = normalized.split()
            if len(words) < 3:
                return normalized
            first = max(1, len(words) // 3)
            second = max(first + 1, (2 * len(words)) // 3)
            marked = words[:]
            marked.insert(first, ',')
            marked.insert(second + 1, ',')
            marked.append('।')
            return ' '.join(marked)

        if chanda == 'shardulavikridita':
            normalized = text.replace('॥', '।').replace('।।', '।')
            if '।' in normalized:
                return normalized
            words = normalized.split()
            if len(words) < 2:
                return normalized
            split_idx = max(1, int(len(words) * 0.7))
            words.insert(split_idx, ',')
            words.append('।')
            return ' '.join(words)

        return text
