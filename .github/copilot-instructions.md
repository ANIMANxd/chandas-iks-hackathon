See context.md in the project root for full architecture, domain rules, 
and tech stack. Always read it before generating code for this project.

Key rules:
- All Sanskrit processing uses IAST transliteration internally
- Laghu = 1 mātrā, Guru = 2 mātrā — never swap these
- Prosody modification uses parselmouth, NOT librosa pitch shifting
- Base TTS is espeak-ng with -v sa flag, NOT gTTS
- FastAPI backend in api.py, Gradio UI in app.py — keep them separate
- All modules live in the modules/ folder and are imported via the modules package