# Project Context — Chanda-Melodic Constrained Sanskrit Recitation

## What This Project Is
A Proof of Concept (PoC) system that takes a Sanskrit verse as text input and generates audio output where:
- **Rhythm** is governed by the verse's metrical structure (Chandas) — Guru syllables are held twice as long as Laghu syllables
- **Pitch** follows a classical melodic framework — either Vedic 3-level pitch accents or a Rāga-based contour

This is NOT a general-purpose Sanskrit TTS. It is specifically a **prosody-aware recitation engine** that applies classical Indian metrical and melodic rules on top of base TTS synthesis.

---

## Domain Knowledge

### Chandas (Metrical Framework)
Sanskrit poetry uses formal metrical systems called Chandas. Every syllable is classified as:
- **Laghu (L)** — light syllable: short vowel (a, i, u) NOT followed by a consonant cluster → duration weight = 1 mātrā
- **Guru (G)** — heavy syllable: long vowel (ā, ī, ū, e, ai, o, au, ṝ) OR ends with anusvara (ṃ) or visarga (ḥ) OR is followed by a consonant cluster → duration weight = 2 mātrās

### Consonant Cluster Rule (Position-sensitive)
A Laghu syllable becomes Guru if it is followed by two or more consonants (even across word boundaries). This requires lookahead at the verse level, not just syllable level.

### Supported Chandas (v1)
| Chanda | Syllables/Pāda | L/G Pattern |
|---|---|---|
| Anushtubh (Shloka) | 8 per pāda | Pāda 1&3: `_ _ _ _ L G L _` / Pāda 2&4: `_ _ _ _ L G G _` |
| Mandākrāntā | 17 per pāda | `G G G G L L L L L G L G G L G G _` |

Primary target: **Anushtubh**. Mandākrāntā is stretch goal.

### Melodic Frameworks
**Vedic 3-Level Pitch Accent:**
- Anudātta: low (0.85× base pitch)
- Svarita: mid (1.0× base pitch)
- Udātta: high (1.20× base pitch)
- Default Anushtubh contour per pāda (8 syllables): `[mid, mid, mid, mid, low, high, mid, low]`

**Rāga Mode (Bhairavī):**
- Ārohā: Sa Re♭ Ga♭ Ma Pa Dha♭ Ni♭ Sā
- Map ascending half of pāda to ārohā, descending half to avarohā
- Frequency ratios derived from Sa = speaker's base pitch

---

## Technical Stack

| Layer | Library | Notes |
|---|---|---|
| Transliteration | `indic-transliteration` | Devanāgarī → IAST normalization |
| Base TTS | `espeak-ng` (CLI) | Sanskrit phoneme support via `-v sa` |
| Prosody Manipulation | `parselmouth` (Praat Python bindings) | Duration scaling + pitch manipulation |
| Audio Utilities | `librosa`, `pydub` | Normalization, concatenation, export |
| Visualization | `matplotlib`, `librosa.display` | Waveform + pitch curve + L/G annotation |
| UI | `gradio` | Demo interface |
| Language | Python 3.10+ | |

---

## Project Architecture (5 Modules)

```
Input (Devanāgarī or IAST text)
    ↓
[Module 1] Transliterator
    indic-transliteration → normalized IAST string
    ↓
[Module 2] Syllabifier + L/G Classifier
    - Split verse into akshara units
    - Apply Laghu/Guru classification rules
    - Apply consonant cluster lookahead rule
    - Validate against selected Chanda pattern
    Output: [(syllable, 'L'|'G'), ...]
    ↓
[Module 3] Prosody Planner
    - Map L/G sequence to duration multipliers (L=1x, G=2x)
    - Assign pitch values per syllable from selected melodic model
    Output: [(syllable, duration_ms, pitch_hz), ...]
    ↓
[Module 4] Base TTS
    - Call espeak-ng with Sanskrit voice
    - Generate per-syllable audio segments
    Output: list of raw .wav segments
    ↓
[Module 5] Prosody Modifier
    - Use parselmouth to time-stretch each segment to target duration
    - Use parselmouth PitchTier to impose target pitch contour
    - Concatenate segments → final .wav
    Output: final_output.wav
```

---

## Input / Output Spec

**Input:**
- Sanskrit verse text (Devanāgarī Unicode or IAST ASCII)
- Chanda selection: `anushtubh` | `mandakranta`
- Melodic mode: `vedic` | `raga_bhairavi`
- Speaker base pitch (Hz): default 120 Hz

**Output:**
- `output.wav` — the recited audio
- `annotation.txt` — syllable-by-syllable L/G breakdown
- `visualization.png` — waveform + pitch curve + L/G labels

---

## File Structure
```
chanda_reciter/
├── main.py                  # Entry point, Gradio app
├── modules/
│   ├── transliterator.py    # Module 1
│   ├── syllabifier.py       # Module 2 — L/G classifier
│   ├── prosody_planner.py   # Module 3
│   ├── tts_engine.py        # Module 4 — espeak-ng wrapper
│   └── prosody_modifier.py  # Module 5 — parselmouth
├── data/
│   ├── verses.json          # Curated verse library with metadata
│   └── chanda_patterns.json # L/G patterns per Chanda
├── tests/
│   └── test_syllabifier.py  # Unit tests with manually annotated ground truth
├── outputs/                 # Generated audio + visualizations
├── requirements.txt
└── README.md
```

---

## Test Verses (Ground Truth)

### Verse 1 — Bhagavad Gita 1.1 (Anushtubh)
```
धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः
IAST: dharmakṣetre kurukṣetre samavetā yuyutsavaḥ
Expected L/G: G G G G L G L G (pāda 1)
```

### Verse 2 — Gita 2.47 (Anushtubh)
```
कर्मण्येवाधिकारस्ते मा फलेषु कदाचन
IAST: karmaṇyevādhikāraste mā phaleṣu kadācana
```

---

## Key Constraints
- Everything built during hackathon period (March 22–29, 2026)
- Open source libraries only
- Must be reproducible — single command setup
- Deliverables: working PoC + audio output + documentation
- Video submission: strict 2-minute limit

---

## What NOT To Do
- Do NOT use neural TTS models (too slow to train, overkill for PoC)
- Do NOT use gTTS as base (no phoneme control)
- Do NOT skip the consonant cluster lookahead rule (judges are IKS experts)
- Do NOT hardcode pitch values as absolute Hz (use ratios relative to base pitch for speaker independence)