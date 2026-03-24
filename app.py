"""
Gradio UI — ChandaEngine Demo Interface
Calls the FastAPI backend at localhost:8000.

Run:
    # Terminal 1 — start the API
    python api.py

    # Terminal 2 — start the UI
    python app.py
"""

import requests
import json
import os
import tempfile
from pathlib import Path

import gradio as gr

API_BASE = os.getenv("CHANDA_API_URL", "http://localhost:8000")

# ── Curated verse library ──────────────────────────────────────────────────────

VERSE_LIBRARY = {
    "Bhagavad Gita 1.1": "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः",
    "Bhagavad Gita 2.47": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
    "Mahāmṛtyuñjaya Mantra": "त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्",
    "Custom input": ""
}


# ── API helpers ────────────────────────────────────────────────────────────────

def call_analyze(verse: str, chanda: str) -> dict:
    try:
        r = requests.post(
            f"{API_BASE}/api/v1/analyze",
            json={"verse": verse, "chanda": chanda},
            timeout=15
        )
        r.raise_for_status()
        return r.json()
    except requests.exceptions.ConnectionError:
        return {"error": "Cannot connect to API. Is the server running? (python api.py)"}
    except Exception as e:
        return {"error": str(e)}


def call_recite(verse: str, chanda: str, melodic_mode: str, base_pitch: float) -> dict:
    try:
        r = requests.post(
            f"{API_BASE}/api/v1/recite",
            json={
                "verse": verse,
                "chanda": chanda,
                "melodic_mode": melodic_mode,
                "base_pitch_hz": base_pitch
            },
            timeout=60
        )
        r.raise_for_status()
        return r.json()
    except requests.exceptions.ConnectionError:
        return {"error": "Cannot connect to API. Is the server running? (python api.py)"}
    except Exception as e:
        return {"error": str(e)}


def download_audio(url: str) -> str:
    """Download audio from API and return local temp path for Gradio."""
    try:
        full_url = f"{API_BASE}{url}"
        r = requests.get(full_url, timeout=30)
        r.raise_for_status()
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        tmp.write(r.content)
        tmp.close()
        return tmp.name
    except Exception:
        return None

def download_image(url: str) -> str:
    """Download visualization image from API and return local temp path."""
    try:
        full_url = f"{API_BASE}{url}"
        r = requests.get(full_url, timeout=30)
        r.raise_for_status()
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
        tmp.write(r.content)
        tmp.close()
        return tmp.name
    except Exception:
        return None


# ── Event handlers ─────────────────────────────────────────────────────────────

def on_verse_select(verse_name: str) -> str:
    """Populate text box when user picks from the library."""
    return VERSE_LIBRARY.get(verse_name, "")


def on_analyze(verse: str, chanda: str):
    """Real-time analysis: show L/G annotation without generating audio."""
    if not verse.strip():
        return "Please enter a Sanskrit verse.", ""

    data = call_analyze(verse, chanda)

    if "error" in data:
        return f"❌ {data['error']}", ""

    # Build annotation output
    lg_display = "  ".join(
        f"**{s['text']}** `{s['weight']}`"
        for s in data.get("syllables", [])
    )

    validation_icon = "✅" if data.get("chanda_valid") else "⚠️"
    score = data.get("chanda_score", 0) * 100
    violations = data.get("chanda_violations", [])

    status = (
        f"{validation_icon} Chanda match: **{score:.0f}%**"
        + (f"\n\nViolations:\n" + "\n".join(f"- {v}" for v in violations)
           if violations else "")
    )

    annotation_text = data.get("annotation", "")

    return status, annotation_text


def on_generate(verse: str, chanda: str, melodic_mode: str, base_pitch: float):
    """
    Full pipeline: analyze + generate audio + visualization.
    Returns: status_md, annotation_text, audio_path, viz_image_path, timing_md
    """
    if not verse.strip():
        return "Please enter a Sanskrit verse.", "", None, None, ""

    data = call_recite(verse, chanda, melodic_mode, base_pitch)

    if "error" in data:
        return f"❌ {data['error']}", "", None, None, ""

    # Status summary
    valid_icon = "✅" if data.get("chanda_valid") else "⚠️"
    status = (
        f"{valid_icon} Generated in **{data.get('processing_time_ms', 0):.0f}ms**  \n"
        f"Syllables: **{data.get('syllable_count', 0)}**  ·  "
        f"Duration: **{data.get('total_duration_ms', 0):.0f}ms**  ·  "
        f"Chanda match: **{data.get('chanda_score', 0)*100:.0f}%**  \n"
        f"L/G: `{data.get('lg_string', '')}`"
    )

    annotation = data.get("annotation", "")
    timing = data.get("timing_table", "")

    # Fetch audio file
    audio_path = None
    if data.get("audio_url"):
        audio_path = download_audio(data["audio_url"])

    # Fetch visualization
    viz_path = None
    if data.get("visualization_url"):
        viz_path = download_image(data["visualization_url"])

    return status, annotation, audio_path, viz_path, timing


# ── UI Layout ──────────────────────────────────────────────────────────────────

CUSTOM_CSS = """
/* Main theme */
.gradio-container {
    font-family: 'Segoe UI', sans-serif;
    max-width: 1100px !important;
}

/* Header */
.header-box {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    border-radius: 12px;
    padding: 24px 32px;
    margin-bottom: 16px;
    border: 1px solid rgba(255,165,0,0.3);
}

/* Annotation display */
.annotation-box textarea {
    font-family: 'Courier New', monospace !important;
    font-size: 13px !important;
    background: #0d1117 !important;
    color: #e6e6e6 !important;
}

/* Guru highlight */
.guru { color: #FF6B35; font-weight: bold; }
.laghu { color: #4CAF50; }

/* Generate button */
.generate-btn {
    background: linear-gradient(90deg, #e65c00, #f9d423) !important;
    border: none !important;
    font-weight: bold !important;
    font-size: 16px !important;
}
"""

def build_ui():
    with gr.Blocks(
        title="ChandaEngine — Sanskrit Recitation",
        css=CUSTOM_CSS,
        theme=gr.themes.Base(
            primary_hue="orange",
            neutral_hue="slate",
        )
    ) as demo:

        # ── Header ─────────────────────────────────────────────────────────
        gr.HTML("""
        <div class="header-box">
            <h1 style="color:#F9A825; margin:0; font-size:28px; letter-spacing:1px;">
                ॐ ChandaEngine
            </h1>
            <p style="color:#b0bec5; margin:8px 0 0 0; font-size:15px;">
                Chanda-Melodic Constrained Sanskrit Recitation · IKS Hackathon 2026
            </p>
        </div>
        """)

        with gr.Row():

            # ── Left column: Input ──────────────────────────────────────────
            with gr.Column(scale=1):
                gr.Markdown("### 📜 Input")

                verse_selector = gr.Dropdown(
                    choices=list(VERSE_LIBRARY.keys()),
                    value="Bhagavad Gita 1.1",
                    label="Select from verse library"
                )

                verse_input = gr.Textbox(
                    label="Sanskrit Verse (Devanāgarī or IAST)",
                    value=VERSE_LIBRARY["Bhagavad Gita 1.1"],
                    lines=3,
                    placeholder="Enter verse here..."
                )

                with gr.Row():
                    chanda_select = gr.Dropdown(
                        choices=["anushtubh", "mandakranta"],
                        value="anushtubh",
                        label="Chanda (Metrical Framework)"
                    )
                    melodic_select = gr.Dropdown(
                        choices=["vedic", "raga_bhairavi"],
                        value="vedic",
                        label="Melodic Mode"
                    )

                base_pitch = gr.Slider(
                    minimum=80,
                    maximum=350,
                    value=200,
                    step=10,
                    label="Base Pitch Hz  (Female ≈ 220, Male ≈ 120)"
                )

                with gr.Row():
                    analyze_btn = gr.Button("🔍 Analyze (fast)", variant="secondary")
                    generate_btn = gr.Button("🎵 Generate Audio", variant="primary",
                                             elem_classes=["generate-btn"])

            # ── Right column: Output ────────────────────────────────────────
            with gr.Column(scale=1):
                gr.Markdown("### 📊 Output")

                status_md = gr.Markdown("*Ready. Enter a verse and click Analyze or Generate.*")

                with gr.Tabs():

                    with gr.Tab("🎵 Audio"):
                        audio_output = gr.Audio(
                            label="Chanda-Constrained Recitation",
                            type="filepath"
                        )
                        gr.Markdown(
                            "*Compare with raw TTS to hear the difference in rhythm and pitch.*"
                        )

                    with gr.Tab("📋 L/G Annotation"):
                        annotation_output = gr.Textbox(
                            label="Syllable Annotation",
                            lines=12,
                            interactive=False,
                            elem_classes=["annotation-box"]
                        )

                    with gr.Tab("📈 Visualization"):
                        viz_output = gr.Image(
                            label="Waveform · Pitch Contour · L/G Pattern",
                            type="filepath"
                        )

                    with gr.Tab("⏱ Timing Table"):
                        timing_output = gr.Textbox(
                            label="Duration + Pitch per Syllable",
                            lines=12,
                            interactive=False,
                            elem_classes=["annotation-box"]
                        )

        # ── Examples ───────────────────────────────────────────────────────
        gr.Markdown("---")
        gr.Markdown("### 📖 About")
        gr.HTML("""
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-top:8px;">
            <div style="background:#1a1a2e; border-radius:8px; padding:16px; border:1px solid #333;">
                <h4 style="color:#F9A825; margin:0 0 8px 0;">Chandas</h4>
                <p style="color:#b0bec5; font-size:13px; margin:0;">
                    Sanskrit metrical science. Every syllable is Laghu (light, 1 mātrā)
                    or Guru (heavy, 2 mātrās), defining the verse's rhythm.
                </p>
            </div>
            <div style="background:#1a1a2e; border-radius:8px; padding:16px; border:1px solid #333;">
                <h4 style="color:#F9A825; margin:0 0 8px 0;">Vedic Pitch</h4>
                <p style="color:#b0bec5; font-size:13px; margin:0;">
                    Three-level system: Anudātta (low ↓), Svarita (mid →),
                    Udātta (high ↑) — the melodic backbone of Vedic recitation.
                </p>
            </div>
            <div style="background:#1a1a2e; border-radius:8px; padding:16px; border:1px solid #333;">
                <h4 style="color:#F9A825; margin:0 0 8px 0;">Rāga Bhairavī</h4>
                <p style="color:#b0bec5; font-size:13px; margin:0;">
                    Classical rāga with komal (flat) Re, Ga, Dha, Ni.
                    Ārohā-avarohā arch mapped to verse structure.
                </p>
            </div>
        </div>
        """)

        # ── Event wiring ───────────────────────────────────────────────────
        verse_selector.change(
            fn=on_verse_select,
            inputs=[verse_selector],
            outputs=[verse_input]
        )

        analyze_btn.click(
            fn=on_analyze,
            inputs=[verse_input, chanda_select],
            outputs=[status_md, annotation_output]
        )

        generate_btn.click(
            fn=on_generate,
            inputs=[verse_input, chanda_select, melodic_select, base_pitch],
            outputs=[status_md, annotation_output, audio_output, viz_output, timing_output]
        )

    return demo


if __name__ == "__main__":
    demo = build_ui()
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        show_error=True
    )
