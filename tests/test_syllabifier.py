"""
Tests for the Syllabifier and Engine.
Uses manually verified L/G annotations as ground truth.

Run with:
    python -m pytest tests/test_syllabifier.py -v
OR:
    python tests/test_syllabifier.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from modules.transliterator import Transliterator
from modules.syllabifier import Syllabifier


# ── Test data: manually verified L/G sequences ────────────────────────────────
# Source: traditional recitation + Chandas Shastra annotations
# Verified by domain expert

TEST_CASES = [
    {
        "id": "simple_a",
        "iast": "a",
        "expected_lg": ["L"],
        "description": "Single short vowel → Laghu"
    },
    {
        "id": "simple_aa",
        "iast": "ā",
        "expected_lg": ["G"],
        "description": "Single long vowel → Guru"
    },
    {
        "id": "simple_e",
        "iast": "e",
        "expected_lg": ["G"],
        "description": "Diphthong e → always Guru"
    },
    {
        "id": "anusvara",
        "iast": "saṃ",
        "expected_lg": ["G"],
        "description": "Anusvāra makes syllable Guru"
    },
    {
        "id": "visarga",
        "iast": "namaḥ",
        "expected_lg": ["L", "G"],
        "description": "na=Laghu, maḥ=Guru (visarga)"
    },
    {
        "id": "karma",
        "iast": "karma",
        "expected_lg": ["G", "L"],
        "description": "kar=Guru (consonant cluster r+m), ma=Laghu"
    },
    {
        "id": "dharma",
        "iast": "dharma",
        "expected_lg": ["G", "L"],
        "description": "dha=Guru (followed by r+m cluster), ma=Laghu"
    },
    {
        "id": "namaste",
        "iast": "namaste",
        "expected_lg": ["L", "G", "G"],
        "description": "na=Laghu, ma=Guru (followed by st), ste=Guru"
    },
    {
        "id": "om_namah_shivaya",
        "iast": "oṃ namaḥ śivāya",
        "expected_lg": ["G", "L", "G", "L", "G", "L"],
        "description": "oṃ=Guru, na=Laghu, maḥ=Guru, śi=Laghu, vā=Guru, ya=Laghu "
                       "(ya: short 'a', no following cluster → correct Laghu)"
    },
    {
        "id": "word_final_anusvara_tatam",
        "iast": "tataṃ",
        "expected_lg": ["L", "G"],
        "description": "Word-final anusvara: ta(L) + taṃ(G)"
    },
    {
        "id": "word_final_anusvara_idam",
        "iast": "idaṃ",
        "expected_lg": ["L", "G"],
        "description": "Word-final anusvara: i(L) + daṃ(G)"
    },
    {
        "id": "visarga_yah",
        "iast": "yaḥ",
        "expected_lg": ["G"],
        "description": "Visarga at word end always Guru"
    },
    {
        "id": "sandhi_tat_tvam",
        "iast": "tat tvam",
        "expected_lg": ["G", "L"],
        "description": "Across-word consonant cluster keeps 'tat' heavy"
    },
    {
        "id": "sandhi_yat_karma",
        "iast": "yat karma",
        "expected_lg": ["G", "G", "L"],
        "description": "Across-word cluster handling remains correct"
    },
    {
        "id": "compound_long_vowels_bhutanam",
        "iast": "bhūtānāṃ",
        "expected_lg": ["G", "G", "G"],
        "description": "Long vowels inside compounds remain Guru"
    },
    {
        "id": "special_ks_cluster",
        "iast": "akṣara",
        "expected_lg": ["G", "L", "L"],
        "description": "kṣ counted as 2 consonants for cluster rule"
    },
    {
        "id": "special_jn_cluster",
        "iast": "ajñāna",
        "expected_lg": ["G", "G", "L"],
        "description": "jñ counted as 2 consonants for cluster rule"
    },
    {
        "id": "particle_ca",
        "iast": "ca",
        "expected_lg": ["L"],
        "description": "Single-syllable particle ca is Laghu"
    },
    {
        "id": "particle_na",
        "iast": "na",
        "expected_lg": ["L"],
        "description": "Single-syllable particle na is Laghu"
    },
    {
        "id": "particle_tu",
        "iast": "tu",
        "expected_lg": ["L"],
        "description": "Single-syllable particle tu is Laghu"
    },
    {
        "id": "particle_vai",
        "iast": "vai",
        "expected_lg": ["G"],
        "description": "Single-syllable particle vai is Guru (diphthong)"
    },
]

INTEGRATION_VERSES = [
    {
        "id": "anushtubh_1",
        "devanagari": "यतः प्रवृत्तिर्भूतानां येन सर्वमिदं ततम्",
        "iast": "yataḥ pravṛttirbhūtānāṃ yena sarvamidaṃ tatam",
    },
    {
        "id": "anushtubh_2",
        "devanagari": "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज",
        "iast": "sarvadharmān parityajya māmekaṃ śaraṇaṃ vraja",
    },
    {
        "id": "anushtubh_3",
        "devanagari": "ॐ तत्सदिति निर्देशो ब्रह्मणस्त्रिविधः स्मृतः",
        "iast": "oṃ tatsaditi nirdeśo brahmaṇas trividhaḥ smṛtaḥ",
    },
]

# ── Test runner ────────────────────────────────────────────────────────────────

def run_test(test: dict, syllabifier: Syllabifier) -> dict:
    """Run a single test case. Returns result dict."""
    syllables = syllabifier.syllabify_verse(test['iast'])
    actual_lg = [s.weight for s in syllables]
    actual_count = len(actual_lg)
    expected_count = len(test['expected_lg'])

    # Soft match: only check positions that overlap
    overlap = min(actual_count, expected_count)
    matches = sum(
        1 for i in range(overlap)
        if actual_lg[i] == test['expected_lg'][i]
    )
    accuracy = matches / max(expected_count, 1)

    passed = (actual_lg == test['expected_lg'])

    return {
        'id': test['id'],
        'description': test['description'],
        'iast': test['iast'],
        'expected': test['expected_lg'],
        'actual': actual_lg,
        'passed': passed,
        'accuracy': round(accuracy, 3)
    }


def run_all_tests():
    syllabifier = Syllabifier()
    results = []
    passed = 0
    failed = 0

    print("\n" + "═"*70)
    print("  CHANDA ENGINE — SYLLABIFIER TEST SUITE")
    print("═"*70)

    for test in TEST_CASES:
        result = run_test(test, syllabifier)
        results.append(result)

        status = "✓ PASS" if result['passed'] else "✗ FAIL"
        if result['passed']:
            passed += 1
        else:
            failed += 1

        print(f"\n[{status}] {result['id']}: {result['description']}")
        print(f"  IAST:     {result['iast']}")
        print(f"  Expected: {' '.join(result['expected'])}")
        print(f"  Actual:   {' '.join(result['actual'])}")
        if not result['passed']:
            print(f"  Accuracy: {result['accuracy']*100:.0f}%")

    print("\n" + "═"*70)
    print(f"  Results: {passed} passed, {failed} failed out of {len(TEST_CASES)} tests")
    if failed == 0:
        print("  ALL TESTS PASSED ✓")
    else:
        print(f"  {failed} test(s) need attention.")
    print("═"*70 + "\n")

    return passed, failed


def test_transliterator():
    """Test the transliterator module."""
    t = Transliterator()

    print("\n" + "─"*50)
    print("  TRANSLITERATOR TESTS")
    print("─"*50)

    # Test script detection
    devanagari = "धर्मक्षेत्रे"
    iast_input = "dharmakṣetre"

    detected_dev = t._detect_script(devanagari)
    detected_iast = t._detect_script(iast_input)

    print(f"Detect Devanāgarī: {'✓' if detected_dev == 'devanagari' else '✗'} ({detected_dev})")
    print(f"Detect IAST:       {'✓' if detected_iast == 'iast' else '✗'} ({detected_iast})")

    # Test IAST normalization
    normalized = t._normalize_iast("  Dharmakṣetre  ")
    print(f"Normalization:     {'✓' if normalized == 'dharmakṣetre' else '✗'} ({normalized!r})")

    # Test halanta-final normalization behavior
    halanta_norm = t._normalize_iast("tatam")
    print(f"Halanta m→ṃ norm: {'✓' if halanta_norm == 'tataṃ' else '✗'} ({halanta_norm!r})")


def test_anushtubh_integration():
    """Integration tests for full Anushtubh verses (robustness checks)."""
    t = Transliterator()
    s = Syllabifier()

    print("\n" + "─"*50)
    print("  ANUSHTUBH INTEGRATION TESTS")
    print("─"*50)

    for case in INTEGRATION_VERSES:
        try:
            iast = t.to_iast(case["devanagari"])
        except Exception:
            # Fallback for environments without indic-transliteration.
            iast = case["iast"]

        syllables = s.syllabify_verse(iast)
        lg = s.get_lg_string(syllables)
        weights = [x.weight for x in syllables]

        count_ok = len(syllables) == 16
        lg_nonempty = bool(lg.strip())
        has_g = 'G' in weights
        has_l = 'L' in weights
        passed = count_ok and lg_nonempty and has_g and has_l

        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"\n[{status}] {case['id']}")
        print(f"  Syllable count: {len(syllables)}")
        print(f"  L/G string: {lg}")
        print(f"  Has G: {has_g}, Has L: {has_l}")


def test_analyze_only():
    """Test the engine's analyze_only method (no TTS dependency)."""
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    try:
        from engine import ChandaEngine
        engine = ChandaEngine()

        print("\n" + "─"*50)
        print("  ENGINE ANALYSIS TEST (no TTS)")
        print("─"*50)

        result = engine.analyze_only("karmaṇyevādhikāraste", chanda='anushtubh')
        print(f"IAST: {result['iast']}")
        print(f"L/G:  {result['lg_string']}")
        print(f"Count: {result['syllable_count']} syllables")
        print("\nAnnotation:")
        print(result['annotation'])
    except ImportError as e:
        print(f"[SKIP] Engine test requires full install: {e}")


if __name__ == '__main__':
    test_transliterator()
    run_all_tests()
    test_anushtubh_integration()
    test_analyze_only()
