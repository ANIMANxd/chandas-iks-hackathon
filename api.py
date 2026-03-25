"""
FastAPI Layer — ChandaEngine REST API
Wraps the engine for both the Gradio UI and future external consumers.

Endpoints:
  POST /api/v1/recite        → Full pipeline: text → audio
  POST /api/v1/analyze       → Analysis only: text → L/G annotation (no TTS)
  GET  /api/v1/chandas        → List supported Chandas
  GET  /api/v1/modes          → List supported melodic modes
  GET  /api/v1/verses         → Curated verse library
  GET  /api/v1/health         → Health check + system info
  GET  /outputs/{filename}    → Serve generated audio/visualization files
"""

import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parent / '.env', override=True)

import os
import json
import time
import uuid
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from engine import ChandaEngine


# ── App setup ──────────────────────────────────────────────────────────────────

OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

# Single engine instance (reused across requests)
_engine: Optional[ChandaEngine] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _engine
    print("[ChandaAPI] Initializing engine...")
    _engine = ChandaEngine(
        base_pitch_hz=200.0,
        output_dir=str(OUTPUT_DIR),
        tts_speed=80
    )
    print(f"[ChandaAPI] Engine ready. TTS mode: {_engine.tts_engine.mode}")
    yield
    print("[ChandaAPI] Shutdown.")


app = FastAPI(
    title="ChandaEngine API",
    description="Chanda-Melodic Constrained Sanskrit Recitation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — allow all origins for hackathon demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated outputs
app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")


# ── Request / Response models ──────────────────────────────────────────────────

class ReciteRequest(BaseModel):
    verse: str = Field(
        ...,
        description="Sanskrit verse in Devanāgarī or IAST",
        example="धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः"
    )
    chanda: str = Field(
        default="anushtubh",
        description="Metrical framework to apply"
    )
    melodic_mode: str = Field(
        default="vedic",
        description="Melodic/pitch framework to apply"
    )
    base_pitch_hz: Optional[float] = Field(
        default=None,
        description="Speaker base pitch in Hz. Female~220, Male~120. Default: 200.",
        ge=80.0,
        le=400.0
    )

class AnalyzeRequest(BaseModel):
    verse: str = Field(..., description="Sanskrit verse in Devanāgarī or IAST")
    chanda: str = Field(default="anushtubh")

class SyllableOut(BaseModel):
    position: int
    text: str
    weight: str         # 'L' or 'G'
    reason: str

class PlannedOut(BaseModel):
    position: int
    text: str
    weight: str
    duration_ms: float
    pitch_hz: float
    pitch_label: str

class ReciteResponse(BaseModel):
    request_id: str
    verse_iast: str
    chanda: str
    chanda_type: str
    chanda_variant: Optional[str]
    melodic_mode: str
    syllable_count: int
    lg_string: str
    ganas: list[dict]
    syllables: list[SyllableOut]
    planned: list[PlannedOut]
    chanda_valid: bool
    chanda_score: float
    chanda_violations: list[str]
    stt_transcript: Optional[str]
    stt_accuracy: Optional[float]
    total_duration_ms: float
    audio_url: str
    raw_audio_url: Optional[str]
    visualization_url: Optional[str]
    annotation: str
    timing_table: str
    processing_time_ms: float

class AnalyzeResponse(BaseModel):
    verse_iast: str
    chanda: str
    chanda_type: str
    chanda_variant: Optional[str]
    syllable_count: int
    lg_string: str
    ganas: list[dict]
    syllables: list[SyllableOut]
    chanda_valid: bool
    chanda_score: float
    chanda_violations: list[str]
    chanda_detection: list[dict]
    annotation: str


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/api/v1/health")
async def health():
    """Health check and system diagnostics."""
    import shutil
    return {
        "status": "ok",
        "engine_ready": _engine is not None,
        "tts_mode": _engine.tts_engine.mode if _engine else "not initialized",
        "espeak_available": shutil.which("espeak-ng") is not None,
        "parselmouth_available": _check_parselmouth(),
        "supported_chandas": _engine.list_supported_chandas() if _engine else [],
        "supported_modes": _engine.list_supported_modes() if _engine else [],
    }


@app.post("/api/v1/recite", response_model=ReciteResponse)
async def recite(req: ReciteRequest, background_tasks: BackgroundTasks):
    """
    Full pipeline: Sanskrit verse → prosody-constrained audio.
    Returns audio URL, visualization URL, and full annotation.
    """
    if not _engine:
        raise HTTPException(503, "Engine not initialized")

    t0 = time.perf_counter()
    request_id = str(uuid.uuid4())[:8]

    try:
        # Reinitialize engine with custom pitch if provided
        engine = _engine
        if req.base_pitch_hz and req.base_pitch_hz != 200.0:
            engine = ChandaEngine(
                base_pitch_hz=req.base_pitch_hz,
                output_dir=str(OUTPUT_DIR)
            )

        output_filename = f"recite_{request_id}.wav"
        result = engine.recite(
            verse=req.verse,
            chanda=req.chanda,
            melodic_mode=req.melodic_mode,
            output_filename=output_filename
        )

    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Engine error: {str(e)}")

    elapsed_ms = (time.perf_counter() - t0) * 1000

    # Build URLs
    base_url = "/outputs"
    audio_url = f"{base_url}/{output_filename}"
    raw_url = None
    viz_url = None

    if result.raw_audio_path and os.path.exists(result.raw_audio_path):
        raw_name = f"raw_{request_id}.wav"
        raw_dest = OUTPUT_DIR / raw_name
        import shutil
        shutil.copy(result.raw_audio_path, raw_dest)
        raw_url = f"{base_url}/{raw_name}"

    if result.visualization_path and os.path.exists(result.visualization_path):
        viz_url = f"{base_url}/{Path(result.visualization_path).name}"

    return ReciteResponse(
        request_id=request_id,
        verse_iast=result.verse_iast,
        chanda=result.chanda,
        chanda_type=result.chanda_type,
        chanda_variant=result.chanda_variant,
        melodic_mode=result.melodic_mode,
        syllable_count=len(result.syllables),
        lg_string=result.lg_string,
        ganas=result.ganas,
        syllables=[
            SyllableOut(
                position=s.position,
                text=s.text,
                weight=s.weight,
                reason=s.reason
            )
            for s in result.syllables
        ],
        planned=[
            PlannedOut(
                position=i + 1,
                text=p.syllable.text,
                weight=p.syllable.weight,
                duration_ms=p.duration_ms,
                pitch_hz=p.pitch_hz,
                pitch_label=p.pitch_label
            )
            for i, p in enumerate(result.planned)
        ],
        chanda_valid=result.chanda_valid,
        chanda_score=result.chanda_score,
        chanda_violations=result.chanda_violations,
        stt_transcript=result.stt_transcript,
        stt_accuracy=result.stt_accuracy,
        total_duration_ms=result.total_duration_ms,
        audio_url=audio_url,
        raw_audio_url=raw_url,
        visualization_url=viz_url,
        annotation=result.annotation,
        timing_table=result.timing_table,
        processing_time_ms=round(elapsed_ms, 1)
    )


@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    """
    Analysis only — L/G classification with no audio generation.
    Fast endpoint for real-time annotation display.
    """
    if not _engine:
        raise HTTPException(503, "Engine not initialized")

    try:
        iast = _engine.transliterator.to_iast(req.verse)
        syllables = _engine.syllabifier.syllabify_verse(iast)
        chanda_info = _engine._chanda_patterns.get(req.chanda)
        if not chanda_info:
            raise HTTPException(400, f"Unknown Chanda: {req.chanda}")

        evaluation = _engine._evaluate_chanda_on_syllables(syllables, req.chanda)
        detection = _engine.detect_chanda(syllables)
        ganas = _engine.syllabifier.group_into_ganas(syllables)

        return AnalyzeResponse(
            verse_iast=iast,
            chanda=req.chanda,
            chanda_type=chanda_info.get('type', 'akshara_gana'),
            chanda_variant=evaluation['variant'],
            syllable_count=len(syllables),
            lg_string=_engine.syllabifier.get_lg_string(syllables),
            ganas=ganas,
            syllables=[
                SyllableOut(
                    position=s.position,
                    text=s.text,
                    weight=s.weight,
                    reason=s.reason
                )
                for s in syllables
            ],
            chanda_valid=evaluation['valid'],
            chanda_score=evaluation['score'],
            chanda_violations=evaluation['violations'],
            chanda_detection=detection,
            annotation=_engine.syllabifier.annotated_display(syllables)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/api/v1/chandas")
async def list_chandas():
    """List all supported Chandas with metadata."""
    if not _engine:
        raise HTTPException(503, "Engine not initialized")
    return {"chandas": _engine.list_supported_chandas()}


@app.get("/api/v1/modes")
async def list_modes():
    """List supported melodic frameworks."""
    return {
        "modes": [
            {
                "id": "vedic",
                "name": "Vedic 3-Level Pitch Accent",
                "description": "Anudātta (low), Svarita (mid), Udātta (high)"
            },
            {
                "id": "raga_bhairavi",
                "name": "Rāga Bhairavī",
                "description": "Ārohā-avarohā contour mapping on Bhairavī scale"
            }
        ]
    }


@app.get("/api/v1/verses")
async def list_verses():
    """Return the curated verse library."""
    verses_path = Path("data/verses.json")
    if not verses_path.exists():
        return {"verses": []}
    with open(verses_path, "r", encoding="utf-8") as f:
        return {"verses": json.load(f)}


# ── Utilities ──────────────────────────────────────────────────────────────────

def _check_parselmouth() -> bool:
    try:
        import parselmouth
        return True
    except ImportError:
        return False


# ── Dev server entrypoint ──────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
