
# **ChandaEngine**

## *Chanda-Melodic Constrained Sanskrit Recitation*

# **1\. Overview**

ChandaEngine is a computational implementation of Sanskrit Chandas Shastra — the 3,000-year-old science of poetic meter and prosody. The system accepts a Sanskrit verse as input and produces audio output where rhythm is governed by classical Laghu-Guru syllable weights and pitch follows established melodic frameworks.

Modern TTS systems produce Sanskrit that is phonetically intelligible but rhythmically and melodically inert. They ignore the foundational metrical science that defines Sanskrit poetry. ChandaEngine addresses this gap by building a rule-based prosody engine on top of neural speech synthesis.

This is a Proof of Concept developed for the IKS Online Hackathon 2026, organized by Chanakya University's Centre for Indian Knowledge Systems. The emphasis is on demonstrating technical and conceptual viability of integrating Chandas constraints into computational recitation.

# **2\. Domain Background**

## **2.1 Chandas Shastra**

Chandas is one of the six Vedangas — the auxiliary sciences of the Vedas. It governs the metrical structure of Sanskrit poetry through precise rules about syllabic duration, grouping, and pause placement.

## **2.2 Laghu and Guru**

Every Sanskrit syllable is classified as either Laghu (light) or Guru (heavy), corresponding to one mātrā or two mātrās of duration respectively.

| Classification | Symbol | Duration | Rule |
| :---- | :---- | :---- | :---- |
| Laghu | L | 1 mātrā | Short vowel (a, i, u, ṛ) with no following cluster |
| Guru | G | 2 mātrās | Long vowel (ā, ī, ū, e, ai, o, au) OR anusvara (ṃ) OR visarga (ḥ) OR followed by consonant cluster |

## **2.3 The Eight Ganas**

Groups of three syllables form ganas — the fundamental building blocks of classical meters. There are eight ganas, each with a unique L/G pattern:

| Gana | Code | Pattern | Mnemonic |
| :---- | :---- | :---- | :---- |
| ma | GGG | 222 | ma-gana — all heavy |
| na | LLL | 111 | na-gana — all light |
| bha | GLL | 211 | bha-gana |
| ya | LGG | 122 | ya-gana |
| ra | GLG | 212 | ra-gana |
| sa | LLG | 112 | sa-gana |
| ta | GGL | 221 | ta-gana |
| ja | LGL | 121 | ja-gana |

## **2.4 Yati — The Mandatory Pause**

Yati refers to the caesura or pause positions within a verse. These are strictly prescribed in Chandas Shastra and define where a reciter must pause for breath. Yati positions are meter-specific and non-negotiable in classical recitation.

* Anushtubh: yati at every 8th syllable (pada boundaries only)

* Mandākrāntā: yati after syllable 4, after syllable 10, and at pada end

* Shardulavikridita: yati after syllable 12 and at pada end

## **2.5 Vedic Pitch Accents**

Classical Vedic recitation uses a three-level pitch accent system:

* Anudātta (↓) — low pitch, ratio 0.85× base

* Svarita (→) — mid/neutral pitch, ratio 1.0× base

* Udātta (↑) — high pitch, ratio 1.20× base

The Anushtubh default contour per pāda assigns: svarita for positions 1-4, anudātta at position 5, udātta at position 6, svarita at 7, anudātta at 8\.

# **3\. Supported Meters**

ChandaEngine supports 15 classical Sanskrit meters across Akshara Gana Vritta, Matra Vritta, and Vedic Chandas types:

| Meter | Type | Syllables/Pāda | Gana Sequence | Yati Position |
| :---- | :---- | :---- | :---- | :---- |
| Anushtubh (Shloka) | Akshara Gana | 8 | free (pos 5-7 fixed) | Pada end only |
| Indravajrā | Akshara Gana | 11 | ta ta ja ga ga | Pada end |
| Upendravajrā | Akshara Gana | 11 | ja ta ja ga ga | Pada end |
| Vaṃśastha | Akshara Gana | 12 | ja ta ja ra | Pada end |
| Mandākrāntā | Akshara Gana | 17 | ma bha na ta ta ga ga | After 4, 10, pada end |
| Śārdūlavikrīḍita | Akshara Gana | 19 | ma sa ja sa ta ta ga | After 12, pada end |
| Sragdharā | Akshara Gana | 21 | ma ra bha na ya ya ya | After 7, 14, pada end |
| Vasantatilakā | Akshara Gana | 14 | ta bha ja ja ga ga | Pada end |
| Mālinī | Akshara Gana | 15 | na na ma ya ya | After 8, pada end |
| Pṛthvī | Akshara Gana | 17 | ja sa ja sa ya la ga | After 8 (weak) |
| Rathoddhatā | Akshara Gana | 11 | ra na ra la ga | Pada end |
| Sragviṇī | Akshara Gana | 12 | ra ra ra ra | Pada end |
| Bhujaṅgaprayāta | Akshara Gana | 12 | ya ya ya ya | Pada end |
| Toṭaka | Akshara Gana | 12 | sa sa sa sa | Pada end |
| Āryā | Matra Vritta | Variable | 12/18/12/15 matras | Flexible |

Additionally, Gayatri Chandas (Vedic, 3 pādas × 8 syllables) is supported for Rigvedic verses.

# **4\. System Architecture**

ChandaEngine processes input through a strict sequence of five modules. Each module has a defined interface and can be tested independently.

| Module | File | Input | Output |
| :---- | :---- | :---- | :---- |
| 1\. Transliterator | \`modules/transliterator.py\` | Devanāgarī or IAST text | Normalized IAST string |
| 2\. Syllabifier | \`modules/syllabifier.py\` | Normalized IAST | List of Syllable objects with L/G weights |
| 3\. Prosody Planner | \`modules/prosody\_planner.py\` | Syllable list \+ Chanda \+ melodic mode | List of PlannedSyllable with duration\_ms and pitch\_hz |
| 4\. TTS Engine | \`modules/tts\_engine.py\` | Devanāgarī text with yati markers | Audio WAV file path |
| 5\. STT Validator | \`modules/stt\_validator.py\` | Audio WAV file path | Transcript \+ accuracy score |

The full pipeline flow:

Devanāgarī Input

      ↓

\[Module 1\] Transliterator → normalized IAST

      ↓

\[Module 2\] Syllabifier → Laghu/Guru classification \+ consonant cluster lookahead

      ↓

\[Module 3\] Prosody Planner → duration targets \+ Vedic pitch contour \+ yati positions

      ↓

\[Module 4\] TTS Engine (Sarvam AI) → audio WAV

      ↓

\[Module 5\] STT Validator (Sarvam saarika:v2.5) → round-trip accuracy score

      ↓

Output: audio\_url \+ annotation \+ visualization \+ ganas \+ accuracy

## **4.1 Module 1 — Transliterator**

Handles Devanāgarī Unicode to IAST conversion using the indic-transliteration library. Performs NFC Unicode normalization, lowercasing, and punctuation stripping. Auto-detects input script — supports Devanāgarī (Unicode block U+0900–U+097F), IAST, and Harvard-Kyoto.

* Key fix: Halanta (virama ्) at word end correctly maps to anusvara ṃ

* NFC normalization ensures composed forms (ā as single char, not a \+ combining macron)

## **4.2 Module 2 — Syllabifier (Core Contribution)**

This is the most domain-critical module. It implements a single-pass tokenizer that correctly handles all Sanskrit phonological rules:

* Long vowel rule: ā, ī, ū, ṝ, e, ai, o, au → Guru

* Anusvara rule: syllable ending in ṃ → Guru

* Visarga rule: syllable ending in ḥ → Guru

* Consonant cluster lookahead: a Laghu syllable followed by 2+ consonants → Guru (applied across word boundaries)

* Compound consonant counting: kṣ and jñ each count as 2 consonants for cluster detection

* Vipulā variant detection: identifies na-vipulā, bha-vipulā, ra-vipulā forms of Anushtubh

The syllabifier operates in a single pass over the flat token list, correctly handling cross-word sandhi effects.

## **4.3 Module 3 — Prosody Planner**

Maps the L/G sequence to timing and pitch targets:

* Duration: Laghu \= 150ms (1 mātrā), Guru \= 300ms (2 mātrās)

* Vedic pitch: Anudātta \= base × 0.85, Svarita \= base × 1.0, Udātta \= base × 1.20

* Rāga Bhairavī: ārohā-avarohā contour mapping using Bhairavī scale ratios

* Yati marking: inserts Sanskrit danda (।) at meter-specific pause positions in the text

* Gana grouping: groups syllables into triplets and identifies the classical gana name

## **4.4 Module 4 — TTS Engine**

Synthesizes audio using Sarvam AI's TTS API. Sends Devanāgarī text (with yati pause markers) directly for optimal pronunciation quality.

Speaker: manisha | Model: bulbul:v2 | Language: hi-IN | Pace: 0.75 (deliberate recitation speed)

The yati danda (।) in the input causes Sarvam to insert natural pauses at the correct inter-pāda positions, producing authentic recitation rhythm.

Fallback: tone generator produces sine waves when API is unavailable, allowing the analysis pipeline to run without network access.

## **4.5 Module 5 — STT Validator**

Performs round-trip validation by transcribing the generated audio back to text using Sarvam's STT API.

Model: saarika:v2.5 | Language: hi-IN

Computes character-level accuracy by comparing the original Devanāgarī verse to the STT transcript after normalization (removing spaces, dandas, and punctuation). Typical accuracy for Sanskrit through a Hindi STT model is 75-85%, which is expected given Sanskrit is a low-resource language for current STT systems.

# **5\. Project Structure**

chandas-iks-hackathon/

├── engine.py                   \# Main orchestrator — wires all 5 modules

├── api.py                      \# FastAPI backend — 6 REST endpoints

├── app.py                      \# Gradio UI (legacy, replaced by Next.js)

├── demo.html                   \# Standalone demo frontend

├── modules/

│   ├── \_\_init\_\_.py

│   ├── transliterator.py       \# Module 1

│   ├── syllabifier.py          \# Module 2 — core L/G classification

│   ├── prosody\_planner.py      \# Module 3

│   ├── tts\_engine.py           \# Module 4

│   ├── prosody\_modifier.py     \# Audio processing utilities

│   └── stt\_validator.py        \# Module 5

├── data/

│   ├── chanda\_patterns.json    \# 15 Chanda definitions with yati positions

│   └── verses.json             \# Curated verse library with L/G ground truth

├── tests/

│   └── test\_syllabifier.py     \# 21 unit tests — all passing

├── frontend/                   \# Next.js frontend (modern UI)

├── outputs/                    \# Generated audio \+ visualizations

├── .env.example                \# Environment variable template

├── requirements.txt

└── README.md

# **6\. Installation & Setup**

## **6.1 System Requirements**

* Python 3.10 or higher

* Node.js 18+ (for Next.js frontend)

* Windows 10/11, macOS 12+, or Ubuntu 20.04+

* Internet connection for Sarvam AI API calls

* Sarvam AI API key (free tier sufficient for hackathon volume)

## **6.2 Clone the Repository**

git clone https://github.com/ANIMANxd/chandas-iks-hackathon.git

cd chandas-iks-hackathon

## **6.3 Python Environment**

Windows (PowerShell):

py \-3 \-m venv .venv

.\\.venv\\Scripts\\Activate.ps1

python \-m pip install \--upgrade pip

pip install \-r requirements.txt

macOS / Linux:

python3 \-m venv .venv

source .venv/bin/activate

pip install \-r requirements.txt

## **6.4 Environment Variables**

Create a .env file in the project root:

SARVAM\_API\_KEY=your\_api\_key\_here

Get your free API key at https://dashboard.sarvam.ai

STT validation is optional — the system degrades gracefully without a key, returning null for stt\_transcript and stt\_accuracy.

## **6.5 Frontend Setup (Next.js)**

cd frontend

npm install

Create frontend/.env.local:

NEXT\_PUBLIC\_API\_URL=http://localhost:8000

# **7\. Running the System**

## **7.1 Start the Backend API**

Terminal 1 — from project root with venv activated:

python api.py

API runs at http://localhost:8000

Swagger documentation available at http://localhost:8000/docs

## **7.2 Start the Frontend**

Terminal 2:

cd frontend

npm run dev

Frontend runs at http://localhost:3000

## **7.3 Run Tests**

python tests\\test\_syllabifier.py

Expected output: 21 passed, 0 failed — ALL TESTS PASSED

## **7.4 Quick API Test**

With the API running, test via curl or the Swagger UI at /docs:

curl \-X POST http://localhost:8000/api/v1/analyze \\

  \-H "Content-Type: application/json" \\

  \-d '{"verse": "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः", "chanda": "anushtubh"}'

# **8\. API Reference**

## **8.1 Endpoints**

| Method | Endpoint | Description |
| :---- | :---- | :---- |
| POST | \`/api/v1/recite\` | Full pipeline: verse → audio \+ full prosodic metadata |
| POST | \`/api/v1/analyze\` | Analysis only: verse → L/G annotation \+ ganas \+ Chanda validation (no audio) |
| GET | \`/api/v1/chandas\` | List all 15 supported Chandas with metadata |
| GET | \`/api/v1/modes\` | List melodic modes (vedic, raga\_bhairavi) |
| GET | \`/api/v1/verses\` | Curated verse library with verified L/G annotations |
| GET | \`/api/v1/health\` | System health check — TTS mode, API availability |

## **8.2 Recite Request**

POST /api/v1/recite

{

  "verse": "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः",

  "chanda": "anushtubh",

  "melodic\_mode": "vedic",

  "base\_pitch\_hz": 200.0

}

## **8.3 Response Schema (Recite)**

| Field | Type | Description |
| :---- | :---- | :---- |
| request\_id | string | Unique request identifier |
| verse\_iast | string | Normalized IAST transliteration |
| chanda | string | Selected Chanda identifier |
| chanda\_type | string | akshara\_gana | matra\_vritta | vedic\_chandas |
| chanda\_variant | string | Vipulā variant if applicable (e.g. ra\_vipula) |
| syllable\_count | integer | Total syllables detected |
| lg\_string | string | Space-separated L/G sequence |
| syllables | array | Per-syllable objects with position, text, weight, reason |
| ganas | array | Triplet groupings with gana\_name and pattern |
| chanda\_valid | boolean | Strict Chanda validation result |
| chanda\_score | float | 0.0–1.0 match score against selected Chanda |
| chanda\_violations | array | List of position-specific violations |
| chanda\_detection | array | Top 3 auto-detected Chanda matches |
| planned | array | Per-syllable duration\_ms and pitch\_hz targets |
| total\_duration\_ms | float | Total audio duration in milliseconds |
| audio\_url | string | Path to generated .wav file |
| visualization\_url | string | Path to generated .png visualization |
| stt\_transcript | string | null | Round-trip STT transcription |
| stt\_accuracy | float | null | Character-level accuracy percentage |
| processing\_time\_ms | float | End-to-end processing time |

# **9\. Example Output**

Input verse: यतः प्रवृत्तिर्भूतानां येन सर्वमिदं ततम् — Bhagavad Gita 18.46

| Field | Value |
| :---- | :---- |
| Syllable count | 32 (16 per line, 8 per pāda) |
| Chanda detected | Anushtubh with ra-vipulā variant |
| Chanda score | 66.7% strict / 100% with vipulā variants |
| Total duration | 7,650ms (7.65 seconds) |
| STT accuracy | \~78% (Sanskrit through Hindi model) |
| Ganas identified | ja, ma, ma, ja, ja, ra, ja, ta, ma, sa (10 ganas across 32 syllables) |
| Yati positions | After syllable 16 (danda between lines) |
| Processing time | \~4,000ms including Sarvam API call |

## **9.1 Sample L/G Annotation (Pāda 1\)**

Pos  Syllable   L/G  Reason

───  ─────────  ───  ─────────────────────────────────────────

  1  ya           L  Short vowel 'a', no special marker

  2  taḥ          G  Visarga (ḥ) after vowel

  3  pra          L  Short vowel 'a', no special marker

  4  vṛt          G  Consonant cluster (2 consonants follow)

  5  tir          G  Consonant cluster (2 consonants follow)

  6  bhū          G  Long vowel 'ū'

  7  tā           G  Long vowel 'ā'

  8  nāṃ          G  Long vowel 'ā' \+ anusvara

# **10\. Technical Decisions & Rationale**

## **10.1 Rule-Based vs Neural Syllabification**

We chose a rule-based approach for Laghu-Guru classification rather than a trained model. Sanskrit phonological rules are precise, well-documented, and do not require large training data. A rule-based system is also fully interpretable — every classification comes with a human-readable reason, which is essential for an educational and research tool.

## **10.2 Sarvam AI for TTS**

Sarvam AI was selected over espeak-ng for several reasons: espeak-ng has no Sanskrit voice data (the \-v sa flag does not exist in any release), and its Hindi voice produces low-quality output. Sarvam's bulbul:v2 model with Hindi voice and Devanāgarī input produces natural, intelligible audio that judges can evaluate meaningfully.

Sarvam is an open-access Indian AI platform permitted under the hackathon rules (open-source libraries and APIs are explicitly allowed). Its use is declared in this documentation and in the video submission.

## **10.3 Yati Via Danda**

Instead of post-processing audio to insert silence at yati positions, we use the Sanskrit danda (।) punctuation directly in the TTS input. Sarvam's TTS interprets this as a natural pause, producing authentic inter-pāda breath pauses without audio manipulation artifacts.

## **10.4 Single-Pass Syllabifier**

The initial implementation used a two-pass approach (extract syllables, then apply cluster rule). This produced bugs at word boundaries. The rewrite uses a single pass over the flat token list with forward lookahead, correctly handling all cross-word sandhi effects.

## **10.5 Vipulā Variant Support**

Classical Anushtubh in the Mahabharata and Gita frequently uses vipulā (extended) variants where the strict L/G pattern at positions 5-7 is relaxed. Our validator reports both the strict violation and the best matching vipulā variant, allowing judges to see that the verse is valid Sanskrit — just not strict Anushtubh.

# **11\. Known Limitations**

## **11.1 STT Accuracy**

Round-trip STT accuracy of \~78% reflects the state of the art for Sanskrit through Hindi STT models, not a failure of the system. Sanskrit is classified as a low-resource language for computational NLP. As Sanskrit-specific STT models improve, this score will improve automatically.

## **11.2 Sandhi-Split Verses**

External sandhi (phonetic fusion across word boundaries in written Sanskrit) can cause the syllabifier to misidentify syllable boundaries. The current implementation handles the most common cross-word consonant cluster cases but does not perform full sandhi splitting. This is a known open problem in computational Sanskrit processing.

## **11.3 Matra Vritta Support**

Āryā meter is loaded in the system but validation is limited — Matra Vrittas count mātrās rather than syllables, requiring a different validation algorithm. The current validator skips strict pattern checking for matra\_vritta type and reports syllable count only.

## **11.4 Audio Prosody**

The yati pause and pace control via Sarvam parameters affect the overall recitation rhythm. Per-syllable duration scaling (Guru exactly 2× Laghu) is computed by the prosody planner and documented in the timing table, but the actual audio timing depends on Sarvam's internal synthesis. The visualization and annotation tables provide the precise computational targets.

# **12\. Test Suite**

The test suite in tests/test\_syllabifier.py covers 21 unit tests with manually verified ground truth:

| Test Category | Count | Coverage |
| :---- | :---- | :---- |
| Basic vowel classification | 4 | Short, long, diphthong, anusvara |
| Visarga and anusvara rules | 3 | Word-final ṃ and ḥ handling |
| Consonant cluster lookahead | 3 | karma, dharma, namaste |
| Cross-word sandhi | 2 | tat tvam, yat karma |
| Compound long vowels | 1 | bhūtānāṃ — all three Guru |
| Special clusters kṣ/jñ | 2 | akṣara, ajñāna |
| Single-syllable particles | 4 | ca, na, tu, vai |
| Anushtubh integration tests | 3 | Full 16-syllable shlokas |

Run the full suite: python tests\\test\_syllabifier.py

Expected: Results: 21 passed, 0 failed — ALL TESTS PASSED

# **13\. AI Tool Disclosure**

Per hackathon rules, all AI tools used in development are declared here:

| Tool | Purpose | Scope |
| :---- | :---- | :---- |
| Claude (Anthropic) | Architecture design, code generation, documentation | Development assistance — all logic verified and tested manually |
| GitHub Copilot (GPT-5.3-Codex) | In-editor code completion and refactoring | Development assistance |
| Sarvam AI (bulbul:v2) | Sanskrit TTS audio synthesis | Runtime component — declared API usage |
| Sarvam AI (saarika:v2.5) | Round-trip STT validation | Runtime component — declared API usage |

All Sanskrit domain logic — Laghu-Guru rules, Chanda patterns, gana definitions, yati positions, and Vedic pitch contours — was verified against classical sources by team members with Sanskrit background. The AI tools assisted with implementation, not with domain knowledge.

# **14\. Sources & References**

* Pāṇini, Ashtādhyāyī — foundational Sanskrit phonology rules

* Piṅgala, Chandas Shastra — the primary treatise on Sanskrit meters

* Dr. Shruti Kantikar — IKS Hackathon Webinar 2, March 22 2026 — Chandas domain guidance

* Dharmawiki article on Chandas Prakara — online reference for meter patterns

* indic-transliteration Python library — Devanāgarī to IAST conversion

* Sarvam AI API documentation — TTS and STT integration

* librosa documentation — audio processing and visualization

* FastAPI documentation — REST API framework

* Next.js documentation — frontend framework

*ChandaEngine — IKS Online Hackathon 2026*

Chanakya University · March 2026 · Open Source (MIT)
