"""
ChandaEngine — Main Orchestrator
Wires all 5 modules into a single clean API.

Usage:
    from engine import ChandaEngine

    engine = ChandaEngine()
    result = engine.recite(
        verse="धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः",
        chanda="anushtubh",
        melodic_mode="vedic"
    )

    print(result.annotation)
    # result.audio_path → play this .wav
    # result.visualization_path → show this .png
"""

import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parent / '.env', override=True)

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from modules.transliterator import Transliterator
from modules.syllabifier import Syllabifier, Syllable
from modules.prosody_planner import ProsodyPlanner, PlannedSyllable
from modules.tts_engine import TTSEngine
from modules.prosody_modifier import ProsodyModifier
from modules.stt_validator import STTValidator


# ── Result container ───────────────────────────────────────────────────────────

@dataclass
class RecitationResult:
    verse_iast: str
    chanda: str
    chanda_type: str
    chanda_variant: Optional[str]
    melodic_mode: str
    syllables: list[Syllable]
    planned: list[PlannedSyllable]
    ganas: list[dict]
    audio_path: str
    raw_audio_path: Optional[str]
    annotation: str             # Human-readable L/G table
    lg_string: str              # e.g. "G G L G L G G L"
    timing_table: str           # Duration + pitch table
    total_duration_ms: float
    chanda_valid: bool
    chanda_violations: list[str]
    chanda_score: float
    stt_transcript: Optional[str] = None
    stt_accuracy: Optional[float] = None
    visualization_path: Optional[str] = None


# ── Engine ─────────────────────────────────────────────────────────────────────

class ChandaEngine:
    """
    Main orchestrator. Single entry point for the full pipeline.
    """

    def __init__(
        self,
        base_pitch_hz: float = 200.0,
        output_dir: str = 'outputs',
        tts_speed: int = 80
    ):
        """
        Args:
            base_pitch_hz: Speaker neutral pitch. Female ~220Hz, Male ~120Hz.
            output_dir: Where to write output .wav and visualizations.
            tts_speed: espeak-ng speed (WPM). Lower = clearer articulation.
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

        # Load chanda patterns
        patterns_path = Path(__file__).parent / 'data' / 'chanda_patterns.json'
        with open(patterns_path, 'r', encoding='utf-8') as f:
            self._chanda_patterns = json.load(f)

        # Initialize modules
        self.transliterator  = Transliterator()
        self.syllabifier     = Syllabifier()
        self.prosody_planner = ProsodyPlanner(base_pitch_hz=base_pitch_hz)
        self.tts_engine      = TTSEngine(speed=tts_speed)
        self.prosody_modifier = ProsodyModifier(output_dir=output_dir)

    # ── Main API ───────────────────────────────────────────────────────────────

    def recite(
        self,
        verse: str,
        chanda: str = 'anushtubh',
        melodic_mode: str = 'vedic',
        output_filename: Optional[str] = None
    ) -> RecitationResult:
        """
        Full pipeline: text → audio with Chanda-constrained prosody.

        Args:
            verse: Sanskrit verse (Devanāgarī or IAST)
            chanda: 'anushtubh' or 'mandakranta'
            melodic_mode: 'vedic' or 'raga_bhairavi'
            output_filename: Optional custom output filename

        Returns:
            RecitationResult with audio path and all annotations
        """
        if chanda not in self._chanda_patterns:
            raise ValueError(
                f"Unknown Chanda: {chanda}. "
                f"Supported: {list(self._chanda_patterns.keys())}"
            )

        # ── Step 1: Transliterate ──────────────────────────────────────────
        original_verse = verse
        iast = self.transliterator.to_iast(verse)

        # ── Step 2: Syllabify + classify L/G ──────────────────────────────
        syllables = self.syllabifier.syllabify_verse(iast)
        ganas = self.syllabifier.group_into_ganas(syllables)

        # ── Step 3: Validate against Chanda ───────────────────────────────
        chanda_info = self._chanda_patterns[chanda]
        eval_result = self._evaluate_chanda_on_syllables(syllables, chanda)
        all_valid = eval_result['valid']
        all_violations = eval_result['violations']
        chanda_score = eval_result['score']
        chanda_variant = eval_result['variant']
        chanda_type = chanda_info.get('type', 'akshara_gana')

        # ── Step 4: Plan prosody ───────────────────────────────────────────
        planned = self.prosody_planner.plan(syllables, melodic_mode, chanda)

        # Step 4.5: Build yati-marked Devanagari text for TTS pauses
        yati_text = self.prosody_planner.get_yati_marked_devanagari(
            original_devanagari=original_verse,
            chanda=chanda
        )

        if output_filename is None:
            safe_verse = iast[:20].replace(' ', '_').replace('/', '')
            output_filename = f"{safe_verse}_{chanda}_{melodic_mode}.wav"

        # ── Step 5: Single-shot full-verse TTS ─────────────────────────────
        raw_audio = None
        generated_path = self.tts_engine.synthesize_full_verse_sarvam(
            devanagari_text=yati_text,
            pace=0.75,
            pitch=0,
        )
        audio_path = os.path.join(self.output_dir, output_filename)
        import shutil
        shutil.copy(generated_path, audio_path)
        reference_track_path = self.prosody_modifier.generate_melodic_reference_track(
            planned=planned,
            output_path=audio_path
        )
        raw_audio = reference_track_path

        # ── Step 7: Generate visualization ────────────────────────────────
        viz_path = None
        try:
            viz_filename = output_filename.replace('.wav', '_viz.png')
            viz_path = self._generate_visualization(
                planned, audio_path, viz_filename
            )
        except Exception as e:
            print(f"[ChandaEngine] Visualization failed (non-critical): {e}")

        # ── Non-critical STT validation ────────────────────────────────────
        stt_transcript = None
        stt_accuracy = None
        try:
            validator = STTValidator(
                api_key=os.getenv('SARVAM_API_KEY')
            )
            transcript = validator.transcribe(audio_path)
            accuracy = validator.compute_accuracy(verse, transcript)
            stt_transcript = accuracy['transcribed']
            stt_accuracy = accuracy['char_match_score']
        except Exception as e:
            print(f"[STT] Validation failed (non-critical): {e}")

        # ── Build result ───────────────────────────────────────────────────
        return RecitationResult(
            verse_iast=iast,
            chanda=chanda,
            chanda_type=chanda_type,
            chanda_variant=chanda_variant,
            melodic_mode=melodic_mode,
            syllables=syllables,
            planned=planned,
            ganas=ganas,
            audio_path=audio_path,
            raw_audio_path=raw_audio,
            annotation=self.syllabifier.annotated_display(syllables),
            lg_string=self.syllabifier.get_lg_string(syllables),
            timing_table=self.prosody_planner.get_timing_table(planned),
            total_duration_ms=self.prosody_planner.total_duration_ms(planned),
            chanda_valid=all_valid,
            chanda_violations=all_violations,
            chanda_score=round(chanda_score, 3),
            stt_transcript=stt_transcript,
            stt_accuracy=stt_accuracy,
            visualization_path=viz_path
        )

    # ── Visualization ──────────────────────────────────────────────────────────

    def _generate_visualization(
        self,
        planned: list[PlannedSyllable],
        audio_path: str,
        filename: str
    ) -> str:
        """
        Generate a 3-panel visualization:
          Panel 1: Waveform
          Panel 2: Pitch contour
          Panel 3: L/G annotation bar
        """
        import matplotlib
        matplotlib.use('Agg')   # Non-interactive backend
        import matplotlib.pyplot as plt
        import matplotlib.patches as mpatches
        import numpy as np

        fig, axes = plt.subplots(3, 1, figsize=(14, 8))
        fig.suptitle('Chanda-Melodic Sanskrit Recitation Analysis', fontsize=14)

        # ── Panel 1: Waveform ──────────────────────────────────────────────
        ax1 = axes[0]
        try:
            import soundfile as sf
            samples, sr = sf.read(audio_path, dtype='float32')
            times = np.linspace(0, len(samples)/sr, len(samples))
            ax1.plot(times, samples, color='#2196F3', linewidth=0.5, alpha=0.8)
        except Exception:
            ax1.text(0.5, 0.5, 'Waveform (soundfile not available)',
                     ha='center', va='center', transform=ax1.transAxes)
        ax1.set_ylabel('Amplitude')
        ax1.set_title('Waveform')
        ax1.grid(True, alpha=0.3)

        # ── Panel 2: Pitch contour ─────────────────────────────────────────
        ax2 = axes[1]
        syllable_labels = [p.syllable.text for p in planned]
        pitches = [p.pitch_hz for p in planned]
        positions = range(len(planned))

        ax2.plot(positions, pitches, 'o-', color='#E91E63', linewidth=2,
                 markersize=6)
        ax2.fill_between(positions, pitches, alpha=0.2, color='#E91E63')

        for i, (pos, pitch, label) in enumerate(zip(positions, pitches, syllable_labels)):
            ax2.annotate(
                f'{label}\n{pitch:.0f}Hz',
                (pos, pitch),
                textcoords='offset points',
                xytext=(0, 8),
                ha='center',
                fontsize=7
            )

        ax2.set_ylabel('Pitch (Hz)')
        ax2.set_title('Pitch Contour (Melodic Framework)')
        ax2.set_xticks(positions)
        ax2.set_xticklabels(syllable_labels, rotation=45, ha='right', fontsize=8)
        ax2.grid(True, alpha=0.3)

        # ── Panel 3: L/G annotation bar ────────────────────────────────────
        ax3 = axes[2]
        durations = [p.duration_ms for p in planned]
        x_pos = 0
        for i, p in enumerate(planned):
            color = '#FF5722' if p.syllable.weight == 'G' else '#4CAF50'
            width = p.duration_ms / 150   # normalize to mātrā units
            rect = mpatches.FancyBboxPatch(
                (x_pos, 0.1), width * 0.9, 0.8,
                boxstyle='round,pad=0.02',
                facecolor=color, edgecolor='white', linewidth=1
            )
            ax3.add_patch(rect)
            ax3.text(
                x_pos + width * 0.45, 0.5,
                f"{p.syllable.text}\n{p.syllable.weight}",
                ha='center', va='center',
                fontsize=8, color='white', fontweight='bold'
            )
            x_pos += width

        ax3.set_xlim(0, x_pos)
        ax3.set_ylim(0, 1)
        ax3.axis('off')
        ax3.set_title('Syllable L/G Pattern (Orange=Guru, Green=Laghu)')

        plt.tight_layout()

        viz_path = os.path.join(self.output_dir, filename)
        plt.savefig(viz_path, dpi=150, bbox_inches='tight')
        plt.close()

        return viz_path

    # ── Convenience methods ────────────────────────────────────────────────────

    def analyze_only(self, verse: str, chanda: str = 'anushtubh') -> dict:
        """
        Run only the analysis pipeline (no TTS/audio).
        Fast — use this for testing the syllabifier.
        """
        iast = self.transliterator.to_iast(verse)
        syllables = self.syllabifier.syllabify_verse(iast)
        evaluation = self._evaluate_chanda_on_syllables(syllables, chanda)
        return {
            'iast': iast,
            'syllables': syllables,
            'ganas': self.syllabifier.group_into_ganas(syllables),
            'lg_string': self.syllabifier.get_lg_string(syllables),
            'annotation': self.syllabifier.annotated_display(syllables),
            'syllable_count': len(syllables),
            'chanda_valid': evaluation['valid'],
            'chanda_score': evaluation['score'],
            'chanda_violations': evaluation['violations'],
            'chanda_variant': evaluation['variant'],
            'chanda_detection': self.detect_chanda(syllables)
        }

    def _evaluate_chanda_on_syllables(self, syllables: list[Syllable], chanda: str) -> dict:
        chanda_info = self._chanda_patterns[chanda]
        chanda_type = chanda_info.get('type', 'akshara_gana')
        pada_size = chanda_info.get('syllables_per_pada')

        if chanda_type == 'matra_vritta' or pada_size == 'variable':
            expected_matras = chanda_info.get('matras_per_pada', [])
            expected_total = sum(expected_matras) if isinstance(expected_matras, list) else 0
            actual_total = self._matra_count(syllables)
            if expected_total > 0:
                delta = abs(actual_total - expected_total)
                score = max(0.0, 1.0 - (delta / expected_total))
            else:
                score = 1.0
            return {
                'valid': True,
                'violations': [],
                'score': round(score, 3),
                'variant': None,
            }

        if not isinstance(pada_size, int):
            return {
                'valid': False,
                'violations': [f"Unsupported syllables_per_pada: {pada_size}"],
                'score': 0.0,
                'variant': None,
            }

        padas = self.syllabifier.split_into_padas(syllables, pada_size)
        all_violations: list[str] = []
        all_valid = True
        total_score = 0.0
        matched_variants: list[str] = []

        for pada_idx, pada in enumerate(padas):
            if 'odd' in chanda_info['patterns']:
                pattern_key = 'odd' if (pada_idx + 1) % 2 == 1 else 'even'
                pattern = chanda_info['patterns'][pattern_key]
            else:
                pattern_key = 'all'
                pattern = chanda_info['patterns']['all']

            vipula_variants = None
            if pattern_key == 'odd' and 'vipula_variants' in chanda_info:
                vipula_variants = chanda_info['vipula_variants']

            validation = self.syllabifier.validate_against_chanda(
                pada,
                pattern,
                pada_size,
                vipula_variants=vipula_variants,
                strict_syllable_count=True,
            )

            if validation.get('matched_variant'):
                matched_variants.append(validation['matched_variant'])

            if not validation['valid']:
                all_valid = False
                for v in validation['violations']:
                    all_violations.append(f"Pāda {pada_idx+1}: {v}")
            total_score += validation['match_score']

        variant = ', '.join(sorted(set(matched_variants))) if matched_variants else None
        score = total_score / max(len(padas), 1)

        return {
            'valid': all_valid,
            'violations': all_violations,
            'score': round(score, 3),
            'variant': variant,
        }

    def _matra_count(self, syllables: list[Syllable]) -> int:
        return sum(2 if s.weight == 'G' else 1 for s in syllables)

    def detect_chanda(self, syllables: list[Syllable]) -> list[dict]:
        matches = []
        for chanda_id, info in self._chanda_patterns.items():
            evaluation = self._evaluate_chanda_on_syllables(syllables, chanda_id)
            matches.append(
                {
                    'chanda': chanda_id,
                    'score': evaluation['score'],
                    'name': info.get('name', chanda_id),
                }
            )

        matches.sort(key=lambda x: x['score'], reverse=True)
        return matches[:3]

    def list_supported_chandas(self) -> list[dict]:
        return [
            {
                'chanda': key,
                'name': info.get('name', key),
                'type': info.get('type', 'akshara_gana'),
                'syllables_per_pada': info.get('syllables_per_pada'),
                'notes': info.get('notes', ''),
            }
            for key, info in self._chanda_patterns.items()
        ]

    def list_supported_modes(self) -> list[str]:
        return ['vedic', 'raga_bhairavi']
