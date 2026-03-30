# ChandaEngine: Melodic Constrained Sanskrit Recitation

ChandaEngine is an advanced Sanskrit prosody engine developed for the IKS Online Hackathon 2026. It generates Sanskrit recitation audio while strictly preserving core prosodic rules (Chandas), including syllable weights (Laghu/Guru), rhythmic groupings (Ganas), and caesura or pauses (Yati).

## Core Features

- **Linguistic & Metrical Analysis**: 
  - Devanagari to IAST transliteration normalization.
  - Accurate syllabification with classical Laghu (1 matra) and Guru (2 matra) classification.
  - Consonant-cluster lookahead across word boundaries.
  - Chanda validation against structured pattern definitions, including Vipula variants for Anushtubh and variable syllable meters (Matra-vritta).
  - Triplet grouping into classical Ganas (ma, na, bha, ya, ra, sa, ta, ja).
- **Prosody & Audio Synthesis**:
  - Duration planning based on precise syllable weights.
  - Pitch planning supporting both Vedic (3-level accents) and Raga Bhairavi melodic contours.
  - Yati (pause) insertion utilizing prosodic boundary markers.
  - Sanskrit TTS generation powered by espeak-ng (with -v sa flag) and parselmouth for accurate prosodic modification.
- **Advanced Validation & Scoring**:
  - Multi-tiered Chanda scoring and strict violation reporting.
  - Auto-detection algorithm predicting the top 3 most likely Chandas for any given verse.
  - Speech-to-Text (STT) validation via the Sarvam API, computing transcription accuracy scores against the generated audio.
- **Interfaces**:
  - FastAPI backend providing modular endpoints for recitation and analysis.
  - A modern, highly responsive Next.js frontend GUI replacing the earlier Gradio interface for deep interactive demonstrations and visual analytics.

## System Architecture

The pipeline processes input text through a strict sequence of transformations:
Input Text -> Transliterator -> Syllabifier (Laghu/Guru) -> Chanda Validator -> Prosody Planner -> TTS Engine (espeak-ng) -> Prosody Modifier (parselmouth) -> Final Audio & Metadata

---

## Installation & Setup

ChandaEngine requires Python 3.10+ and the espeak-ng system dependency to synthesize Sanskrit audio.

### 1. Installing 3rd-Party Dependencies (espeak-ng)

Because the engine relies heavily on phonetic synthesis, espeak-ng must be installed natively on your operating system and available in your system's PATH.

#### Windows
1. Navigate to the official [espeak-ng Releases page](https://github.com/espeak-ng/espeak-ng/releases).
2. Download the latest Windows installer (e.g., espeak-ng-X.X.X-windows.msi or .exe).
3. Run the installer and complete the setup. 
4. **Critical Step**: You must add the installation directory (typically C:\Program Files\eSpeak NG) to your Windows PATH environment variable.
5. Verify the installation by opening PowerShell and running:
   `powershell
   espeak-ng --version
   `

#### macOS
Install via Homebrew:
`ash
brew install espeak-ng
`
Verify the installation:
`ash
espeak-ng --version
`

#### Linux (Debian/Ubuntu)
Install via the APT package manager:
`ash
sudo apt-get update
sudo apt-get install -y espeak-ng
`
Verify the installation:
`ash
espeak-ng --version
`

### 2. Project Setup

Once espeak-ng is installed and verified, set up the ChandaEngine project environment.

1. **Clone the repository**:
   `ash
   git clone <your-repo-url>
   cd chandas-iks-hackathon
   `

2. **Create and activate a virtual environment**:
   - **Windows**:
     `powershell
     py -3 -m venv venv
     .\venv\Scripts\Activate.ps1
     `
   - **macOS / Linux**:
     `ash
     python3 -m venv venv
     source venv/bin/activate
     `

3. **Install Python dependencies**:
   `ash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   `

### 3. Frontend Environment Setup (Next.js)

The modern frontend is built using Next.js (React). It strictly handles the presentation and API calls to the local engine.

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```
   
2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

### 4. Environment Variables

To enable Speech-to-Text (STT) validation and accuracy scoring, you must provide a Sarvam API key. This step is optional but recommended; the system will gracefully fall back if the key is missing.

- **Windows (PowerShell)**:
  `powershell
  $env:SARVAM_API_KEY="your_api_key_here"
  `
  *(To set it permanently, use setx SARVAM_API_KEY "your_api_key_here" and restart your terminal.)*

- **macOS / Linux**:
  `ash
  export SARVAM_API_KEY="your_api_key_here"
  `

---

## Usage Guide

### Starting the FastAPI Server

The primary backend runs on FastAPI and exposes all core functionality.

- **Windows**:
  `powershell
  .\venv\Scripts\python.exe api.py
  `
- **macOS / Linux**:
  `ash
  python api.py
  `
The API is served at http://localhost:8000. API documentation (Swagger) is available at http://localhost:8000/docs.

### Starting the Gradio UI

To interact with the engine via a graphical interface, start the Gradio app in a separate terminal (ensure your virtual environment is activated).

- **Windows**:
  `powershell
  .\venv\Scripts\python.exe app.py
  `
- **macOS / Linux**:
  `ash
  python app.py
  `
The Gradio UI is accessible at http://localhost:7860.

### Running Tests

To verify that the underlying Syllabifier and Chanda rule validations are functioning correctly, run the test suite:

- **Windows**:
  `powershell
  .\venv\Scripts\python.exe tests\test_syllabifier.py
  `
- **macOS / Linux**:
  `ash
  python tests/test_syllabifier.py
  `

---

## API Reference

### Core Endpoints

- POST /api/v1/recite: Generates audio and full prosodic metadata for a given verse.
- POST /api/v1/analyze: Analyzes text for Chanda matching, Yati, and Ganas without generating audio.
- GET /api/v1/chandas: Lists all supported classical and Vedic meters.

### Payload Examples

**Analysis Request format**:
`json
{
  "verse": "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः",
  "chanda": "anushtubh"
}
`

**Standard Response Schema** (Abridged):
- erse_iast: Normalized internal string.
- chanda_type / chanda_variant: Specific meter categorization.
- syllables: Array of parsed syllable objects mapping weights (L/G).
- ganas: Array of grouped ganas (e.g., ma, na, bha).
- chanda_score / iolations: Detailed prosodic assessment.
- chanda_detection: Array of top 3 predicted meters.
- stt_transcript / stt_accuracy: Output from the Sarvam integration (if enabled).

---

## Troubleshooting

1. **espeak-ng not found error**: 
   Ensure espeak-ng was installed correctly and the executable path is definitively added to your system's PATH variable. Restart your terminal after adding it.
2. **Missing dependencies during tests**: 
   Ensure you are using the precise Python executable located within your virtual environment (e.g., .\venv\Scripts\python.exe) rather than the global Python fallback.
3. **STT Validation disabled**: 
   If stt_transcript and stt_accuracy return as 
ull, ensure your SARVAM_API_KEY is properly exported and valid.