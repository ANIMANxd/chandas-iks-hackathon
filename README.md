# ॐ ChandaEngine

**Chanda-Melodic Constrained Sanskrit Recitation**  
IKS Online Hackathon 2026 · Chanakya University

---

## What It Does

Modern TTS systems produce Sanskrit that is phonetically correct but rhythmically dead.  
ChandaEngine enforces two pillars of classical Sanskrit recitation computationally:

1. **Chandas** — Guru syllables are held 2× longer than Laghu syllables
2. **Melodic framework** — pitch follows Vedic 3-level accents or Rāga Bhairavī contour

Input a Sanskrit verse → get audio that sounds like a trained reciter, not a robot.

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-repo/chanda-engine
cd chanda-engine

# 2. Install system dependency
sudo apt-get install espeak-ng        # Linux
brew install espeak-ng                # macOS

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Run tests (no TTS needed)
python tests/test_syllabifier.py

# 5. Start API
python api.py                         # http://localhost:8000

# 6. Start UI (new terminal)
python app.py                         # http://localhost:7860

# OR: open demo.html in browser (connects to API at localhost:8000)
```

---

## Architecture

```
Input (Devanāgarī or IAST)
    ↓
[Module 1] Transliterator       indic-transliteration
    ↓
[Module 2] Syllabifier          L/G classification + consonant cluster lookahead
    ↓
[Module 3] Prosody Planner      duration map + pitch contour
    ↓
[Module 4] TTS Engine           espeak-ng Sanskrit voice
    ↓
[Module 5] Prosody Modifier     parselmouth duration scaling + pitch manipulation
    ↓
Output: .wav + annotation + visualization
```

---

## Supported Frameworks

| Chanda | Pattern | Status |
|---|---|---|
| Anushtubh (Shloka) | 8 syllables/pāda | ✅ Supported |
| Mandākrāntā | 17 syllables/pāda | ✅ Supported |

| Melodic Mode | Description | Status |
|---|---|---|
| Vedic 3-Level | Anudātta / Svarita / Udātta | ✅ Supported |
| Rāga Bhairavī | Ārohā-avarohā arch | ✅ Supported |

---

## API Reference

```
POST /api/v1/recite     Full pipeline → audio
POST /api/v1/analyze    L/G analysis only (fast, no TTS)
GET  /api/v1/chandas    List supported Chandas
GET  /api/v1/modes      List melodic modes
GET  /api/v1/verses     Curated verse library
GET  /api/v1/health     System status
```

Example:
```bash
curl -X POST http://localhost:8000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"verse": "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः", "chanda": "anushtubh"}'
```

---

## Project Structure

```
chanda_engine/
├── engine.py                 # Main orchestrator
├── api.py                    # FastAPI layer
├── app.py                    # Gradio UI
├── demo.html                 # Standalone demo frontend
├── modules/
│   ├── transliterator.py     # Devanāgarī → IAST
│   ├── syllabifier.py        # L/G classification
│   ├── prosody_planner.py    # Duration + pitch mapping
│   ├── tts_engine.py         # espeak-ng wrapper
│   └── prosody_modifier.py   # parselmouth prosody control
├── data/
│   ├── chanda_patterns.json  # L/G patterns per Chanda
│   └── verses.json           # Curated verse library
├── tests/
│   └── test_syllabifier.py   # Unit tests (9/9 passing)
└── outputs/                  # Generated audio + visualizations
```

---

## AI Disclosure

This project was built with AI assistance (Claude by Anthropic, GitHub Copilot).  
All Sanskrit domain logic (Laghu/Guru rules, Chanda patterns, pitch contours) was  
manually verified against classical sources by team members with Sanskrit background.  
External sources cited: Pāṇini's Ashtādhyāyī, Chandas Shastra, Vedic recitation guidelines.

---

## Team

| Member | Role |
|---|---|
| Aniruddha Bhide | Lead architect, core engine, domain logic |
| [Sanskrit Junior] | Domain QA, verse annotations, pitch verification |
| [Frontend Member] | Gradio UI, visualization |
| [Docs Member] | Documentation, video |

---

## License

MIT — open source, reproducible, extensible.
