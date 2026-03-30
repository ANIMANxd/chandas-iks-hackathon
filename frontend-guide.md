# Comprehensive Frontend Engineering Guide — Chanda-Melodic Sanskrit Recitation

Welcome, Frontend Engineer. This document is your blueprint for the **Chanda-Melodic Constrained Sanskrit Recitation** Proof of Concept UI. 

Your objective is to build a deeply immersive, highly responsive, and visually stunning web application that bridges ancient Indian poetic architecture (Chandas) with modern, "cybernetic" data visualization. 

---

## 1. UI/UX Vision & The "Mystical Tech" Aesthetic

We are going for a theme that feels like an **Ancient Supercomputer** analyzing a divine language grid. It should feel technical, rhythmic, and spiritual all at once.

### Color Palette
*   **Base Void (Background):** `#05050A` (Deepest space black)
*   **Surface Depth (Cards/Panels):** `#11131A` (Slightly elevated dark gray, preferably with `backdrop-filter: blur()`)
*   **Laghu Accent (Short Syllables):** `#45A29E` (Electric Cyan) — represents swift, 1-mātrā units.
*   **Guru Accent (Long Syllables):** `#F2A900` (Neon Gold/Amber) — represents heavy, 2-mātrā units.
*   **Warning/Violation:** `#E94560` (Crimson Red) — flashes when the metrical rule is broken.
*   **Typography (Primary):** `#E0E6ED` (Soft, legible off-white/silver)

### Typography
*   **UI/Controls Text:** `Inter`, `Manrope`, or `JetBrains Mono` for a technical, precise feel.
*   **Sanskrit/Devanāgarī Output:** `Tiro Devanagari Sanskrit` or `Noto Sans Devanagari` (Must look elegant and highly legible). 

### "Crazy" Micro-Interactions & Animations (The Secret Sauce)
1.  **Syllable Grid Assembly:** When analysis returns, the syllable blocks (`L` and `G`) should assemble with a staggered entry animation (e.g., using `framer-motion` `staggerChildren`).
2.  **Relative Sizing:** Visually, a **Guru (G)** block must be exactly **2x the width** of a **Laghu (L)** block, visually reinforcing the concept of *mātrās* (time units).
3.  **Karaoke-Sync Highlight:** During playback, query the `planned` array from the API (`duration_ms` per syllable). Highlight the corresponding syllable block dynamically exactly as the audio hits it.
4.  **Pulse Effects:** When hovering over a syllable block, show a tooltip explaining *why* it got classified as L or G (e.g., "Short Vowel = L", or "Followed by Consonant Cluster = G"). 
5.  **Ganas Visualization:** Group syllables visually into *Ganas* (groups of 3 syllables) if provided by the analysis.

---

## 2. Component Architecture & User Flow

The application should be a Single Page Application (SPA), split roughly into two primary visual zones: **The Control Deck (Left/Top)** and **The Analysis Canvas (Right/Bottom)**.

### A. The Control Deck
*   **`VerseInputArea`**: 
    *   A massive, glowing `<textarea>` taking center stage initially. 
    *   *Features*: Clean placeholder, auto-resize, clear button, and a "Load Example Verse" dropdown (fetching from `/api/v1/verses`).
*   **`EngineSettings`**:
    *   **Chanda Dropdown**: Select `anushtubh`, `mandakranta`, etc.
    *   **Melodic Mode Toggle**: Radio cards visualizing the mode (e.g., `vedic`, `raga_bhairavi`).
    *   **Base Pitch Slider**: Clean range slider (`80Hz` to `300Hz`) to configure the vocal root note.
*   **`ActionCenter`**:
    *   A massive **"Synthesize & Recite"** Floating Action Button. Needs incredible loading states (spinners + glowing text) because the backend synthesis takes a few seconds.

### B. The Analysis Canvas (The "X-Ray")
*   **`LiveAnalyzer`**:
    *   As the user types in the `VerseInputArea`, debounce the input (e.g., 500ms) and silently call the `POST /api/v1/analyze` endpoint.
    *   Render the Laghu/Guru string (`lg_string`) dynamically. If there's a `chanda_violation`, highlight the exact syllable in Crimson Red.
*   **`ProsodyPlaybackDeck`**:
    *   Appears *after* synthesis completes.
    *   Shows a full-width custom audio player (`wavesurfer.js` is highly recommended).
    *   Displays the `visualization_url` (a generated PNG showing the exact pitch curve and waveform) as a background layer, with the UI elements floating above it.

---

## 3. Complete API Specification

The backend runs on **FastAPI** (`http://localhost:8000` locally). CORS is fully open limitlessly.

### 3.1 Metadata & Health Endpoints

#### `GET /api/v1/health`
**Response:**
```json
{
  "status": "ok",
  "engine_ready": true,
  "tts_mode": "espeak-ng",
  "supported_chandas": ["anushtubh", "mandakranta"],
  "supported_modes": ["vedic", "raga_bhairavi"]
}
```

#### `GET /api/v1/chandas`
Fetches the registry of supported metrical patterns.
#### `GET /api/v1/modes`
Fetches supported pitch/melodic modes.
#### `GET /api/v1/verses`
Fetches a curated library of test verses (useful for "Populate Example" buttons).

---

### 3.2 Live Analysis Endpoint

**`POST /api/v1/analyze`**
Use this for **debounced, real-time typing feedback**. It executes instantly (no TTS generation).

**Request Body:**
```json
{
  "verse": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
  "chanda": "anushtubh"
}
```

**Response (200 OK):**
```json
{
  "verse_iast": "karmaṇyevādhikāraste mā phaleṣu kadācana",
  "chanda": "anushtubh",
  "chanda_type": "...",
  "syllable_count": 16,
  "lg_string": "G G G G L G G G G L G L L G L L",
  "ganas": [{"name": "ma", "pattern": "G G G"}, ...],
  "syllables": [
    { "position": 0, "text": "kar", "weight": "G", "reason": "Followed by consonant cluster" },
    { "position": 1, "text": "ma", "weight": "L", "reason": "Short Vowel 'a'" }
    // ...
  ],
  "chanda_valid": true,
  "chanda_score": 1.0,
  "chanda_violations": [],
  "annotation": "Detailed text dump of rules applied"
}
```
*Frontend Action:* Use `lg_string` and `syllables` arrays to render the visual blocks. If `chanda_valid` is false, map the `chanda_violations` array to error UI.

---

### 3.3 Core Synthesis Endpoint

**`POST /api/v1/recite`**
Use this when the user clicks **Synthesize**. Show a heavy loading state.

**Request Body:**
```json
{
  "verse": "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः",
  "chanda": "anushtubh",
  "melodic_mode": "vedic",
  "base_pitch_hz": 120.0 
}
```

**Response (200 OK):**
```json
{
  "request_id": "a1b2c3d4",
  "verse_iast": "dharmakṣetre kurukṣetre samavetā yuyutsavaḥ",
  "chanda": "anushtubh",
  "chanda_type": "shloka",
  "melodic_mode": "vedic",
  "syllable_count": 16,
  "lg_string": "G G G G L G L G L L G G L G L G",
  "ganas": [],
  "syllables": [
     { "position": 0, "text": "dhar", "weight": "G", "reason": "Cluster" }
  ],
  "planned": [
     { 
       "position": 0, 
       "text": "dhar", 
       "weight": "G", 
       "duration_ms": 400.0,
       "pitch_hz": 120.0, 
       "pitch_label": "mid" 
     }
  ],
  "chanda_valid": true,
  "chanda_score": 1.0,
  "chanda_violations": [],
  "total_duration_ms": 4800.0,
  "audio_url": "http://localhost:8000/outputs/recite_a1b2c3d4.wav",
  "raw_audio_url": "http://localhost:8000/outputs/raw_a1b2c3d4.wav",
  "visualization_url": "http://localhost:8000/outputs/vis_a1b2c3d4.png",
  "annotation": "...",
  "timing_table": "...",
  "processing_time_ms": 2504.2
}
```

---

## 4. State Management Recommendation

Because of the complex interaction between the audio playback and the UI highlighting, you should use **Zustand** (or React Context) to manage the global state:

```typescript
interface AppState {
  verse: str;
  settings: { chanda: str, mode: str, pitch: number };
  analysisResult: AnalyzeResponse | null;
  synthesisResult: ReciteResponse | null;
  isSynthesizing: boolean;
  currentPlaybackTimeMs: number; 
  // Map currentPlaybackTimeMs against the `planned[i].duration_ms` sequence!
}
```

## 5. Summary of Deliverables for Frontend

1.  **Input View:** Textarea with debounced background analysis indicating if the text actually matches the selected meter (Chandas). Connect to `/analyze`.
2.  **Visual Grid:** Render the prosodic structure dynamically in real-time. Make Gurus (G) double the size of Laghus (L).
3.  **Synthesis Loader:** Call `/recite`, show a beautiful skeleton loader or pulsing animation.
4.  **Playback View:** Mount the returned `audio_url` into an audio player. Visually step through the `planned` array syllables as the audio plays based on elapsed time.
5.  **Bonus (Optional):** Render the returned `visualization_url` (which contains the exact py-generated pitch curve) inside the UI canvas.

Have fun and make it slick. The backend will handle all the hard math; your job is to make the math look incredibly beautiful and interactive!