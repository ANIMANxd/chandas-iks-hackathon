# ChandaEngine

Chanda-Melodic Constrained Sanskrit Recitation  
IKS Online Hackathon 2026

## Overview

ChandaEngine generates Sanskrit recitation audio while preserving core prosodic rules.

The pipeline enforces:

1. Chandas timing constraints:
    Laghu = 1 matra, Guru = 2 matras
2. Melodic contour constraints:
    Vedic 3-level accents or Raga Bhairavi contour

Input can be Devanagari or IAST. Internal processing is done in IAST.

## Implemented Features

### Core linguistic and metrical features

1. Devanagari to IAST transliteration normalization
2. Syllabification with classical Laghu or Guru classification
3. Consonant-cluster lookahead across word boundaries
4. Chanda validation against structured pattern definitions
5. Vipula variant fallback for Anushtubh odd padas
6. Matra-vritta handling for variable syllable meters such as Arya
7. Gana grouping in triplets:
    ma, na, bha, ya, ra, sa, ta, ja

### Prosody and audio features

1. Duration planning from syllable weight
2. Pitch planning for Vedic mode and Raga Bhairavi mode
3. Yati pause insertion using yati_positions_in_pada when available
4. Sanskrit TTS generation via espeak-ng and Sarvam integration path
5. Visualization output for waveform, pitch contour, and L or G pattern

### Analysis and scoring features

1. Chanda score and violation reporting
2. Chanda type awareness:
    akshara_gana, matra_vritta, vedic_chandas
3. Top-3 chanda auto-detection by match score
4. STT-based non-critical validation via Sarvam Speech-to-Text:
    transcript capture and character-level accuracy score

### API and UI features

1. FastAPI endpoints for recitation and analysis
2. Gradio UI for interactive demo usage
3. Supported-chandas metadata endpoint
4. Rich response payloads including syllables, ganas, chanda metadata, and optional STT metrics

## Supported Chandas

Chanda definitions are loaded from data/chanda_patterns.json.

Current dataset includes 15+ classical entries and supports:

1. Fixed akshara-gana meters
2. Variable matra-vritta entries
3. Vedic chandas entries

Use GET /api/v1/chandas to inspect the active list with name, type, syllables_per_pada, and notes.

## Architecture

Input text
  -> Transliterator
  -> Syllabifier and LG classifier
  -> Chanda validator and scorer
  -> Prosody planner
  -> TTS engine
  -> Prosody modifier
  -> Output audio and annotations

Key files:

1. engine.py: main orchestrator
2. api.py: FastAPI service
3. app.py: Gradio UI
4. modules/syllabifier.py: syllable analysis, chanda checks, gana grouping
5. modules/prosody_planner.py: duration, pitch, yati pause insertion
6. modules/stt_validator.py: Sarvam STT transcription and accuracy

## Installation Guide

### Prerequisites

1. Python 3.10+
2. espeak-ng installed on system path
3. Git

Optional but recommended:

1. A Python virtual environment
2. SARVAM_API_KEY environment variable for STT validation

### Windows setup (PowerShell)

1. Clone and enter project

    git clone <your-repo-url>
    cd chandas-iks-hackathon

2. Create and activate venv

    py -3 -m venv venv
    .\venv\Scripts\Activate.ps1

3. Install Python dependencies

    python -m pip install --upgrade pip
    pip install -r requirements.txt

4. Install espeak-ng on Windows

    Install from official releases and ensure espeak-ng is available in PATH.
    Verify:

    espeak-ng --version

5. Optional: enable STT validation

    setx SARVAM_API_KEY "your_api_key_here"

    Open a new terminal after setx so the variable is available.

### Linux setup

1. Clone and enter project

    git clone <your-repo-url>
    cd chandas-iks-hackathon

2. Install espeak-ng

    sudo apt-get update
    sudo apt-get install -y espeak-ng

3. Create environment and install deps

    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt

4. Optional STT key

    export SARVAM_API_KEY="your_api_key_here"

### macOS setup

1. Clone and enter project

    git clone <your-repo-url>
    cd chandas-iks-hackathon

2. Install espeak-ng

    brew install espeak-ng

3. Create environment and install deps

    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt

4. Optional STT key

    export SARVAM_API_KEY="your_api_key_here"

## Usage Guide

### Run tests

Windows:

1. .\venv\Scripts\python.exe tests\test_syllabifier.py

Linux or macOS:

1. python tests/test_syllabifier.py

### Start API server

Windows:

1. .\venv\Scripts\python.exe api.py

Linux or macOS:

1. python api.py

API base URL:

1. http://localhost:8000

### Start Gradio UI

In a second terminal with the same environment active:

Windows:

1. .\venv\Scripts\python.exe app.py

Linux or macOS:

1. python app.py

UI URL:

1. http://localhost:7860

### Use demo.html

1. Keep API running on localhost:8000
2. Open demo.html in browser

## API Guide

### Endpoints

1. POST /api/v1/recite
2. POST /api/v1/analyze
3. GET /api/v1/chandas
4. GET /api/v1/modes
5. GET /api/v1/verses
6. GET /api/v1/health

### Analyze example (curl)

curl -X POST http://localhost:8000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"verse":"धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः","chanda":"anushtubh"}'

### Analyze example (PowerShell)

$body = @{
  verse = "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः"
  chanda = "anushtubh"
} | ConvertTo-Json

Invoke-RestMethod \
  -Uri "http://localhost:8000/api/v1/analyze" \
  -Method POST \
  -ContentType "application/json" \
  -Body $body

### Recite response includes

1. verse_iast
2. chanda, chanda_type, chanda_variant
3. syllables and ganas
4. timing and audio URLs
5. chanda_score and violations
6. optional stt_transcript and stt_accuracy

### Analyze response includes

1. verse_iast
2. chanda, chanda_type, chanda_variant
3. syllables and ganas
4. chanda_score and violations
5. chanda_detection (top 3)

## STT Validation (Sarvam)

STT validation is non-blocking and runs after audio generation in recite().

Behavior:

1. If SARVAM_API_KEY is present and API succeeds, transcript and accuracy are returned
2. If STT fails, recitation still succeeds and STT fields remain null

## Project Structure

chandas-iks-hackathon/
  api.py
  app.py
  engine.py
  context.md
  data/
     chanda_patterns.json
     verses.json
  modules/
     transliterator.py
     syllabifier.py
     prosody_planner.py
     tts_engine.py
     prosody_modifier.py
     stt_validator.py
  tests/
     test_syllabifier.py
  outputs/

## Troubleshooting

1. espeak-ng not found:
    install espeak-ng and confirm it is in PATH
2. Import errors in editor but tests pass:
    select the project venv interpreter
3. STT fields are null:
    check SARVAM_API_KEY and network access
4. API not reachable from UI:
    ensure api.py is running on localhost:8000

## License

MIT
