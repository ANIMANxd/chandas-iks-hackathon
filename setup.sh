#!/usr/bin/env bash
set -euo pipefail

VENV_DIR="venv"

# 1. Create a virtual environment
python3 -m venv "$VENV_DIR"

# Activate venv (Linux/macOS first, Git Bash on Windows fallback)
if [ -f "$VENV_DIR/bin/activate" ]; then
  # shellcheck disable=SC1091
  source "$VENV_DIR/bin/activate"
elif [ -f "$VENV_DIR/Scripts/activate" ]; then
  # shellcheck disable=SC1091
  source "$VENV_DIR/Scripts/activate"
else
  echo "ERROR: Could not find venv activation script."
  exit 1
fi

# 2. Install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# 3. Check espeak-ng and print warning if missing
if ! command -v espeak-ng >/dev/null 2>&1; then
  echo "WARNING: espeak-ng is not installed or not on PATH."
  echo "         TTS will fall back or fail depending on runtime path."
fi

# 4. Run tests
python tests/test_syllabifier.py

# 5. Print success only if tests passed
echo "SETUP COMPLETE"
