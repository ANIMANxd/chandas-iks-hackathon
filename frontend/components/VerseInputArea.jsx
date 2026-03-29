'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';

export default function VerseInputArea() {
  const verse = useAppStore((s) => s.verse);
  const setVerse = useAppStore((s) => s.setVerse);
  const analyzeVerse = useAppStore((s) => s.analyzeVerse);
  const availableVerses = useAppStore((s) => s.availableVerses);
  const settings = useAppStore((s) => s.settings);

  const textareaRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const [showExamples, setShowExamples] = useState(false);
  const dropdownRef = useRef(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.max(160, el.scrollHeight) + 'px';
    }
  }, []);

  const debouncedAnalyze = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => analyzeVerse(), 500);
  }, [analyzeVerse]);

  useEffect(() => {
    if (verse.trim()) debouncedAnalyze();
  }, [settings.chanda, debouncedAnalyze, verse]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowExamples(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    setVerse(e.target.value);
    autoResize();
    debouncedAnalyze();
  };

  const handleClear = () => {
    setVerse('');
    useAppStore.getState().clearAnalysis();
    useAppStore.getState().clearSynthesis();
    if (textareaRef.current) textareaRef.current.style.height = '160px';
  };

  const handleLoadExample = (v) => {
    const verseText = v.devanagari || v.verse || v.text || '';
    setVerse(verseText);
    setShowExamples(false);
    setTimeout(() => {
      autoResize();
      debouncedAnalyze();
    }, 50);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <label
          htmlFor="verse-input"
          className="pb-1 border-b-[2px] border-[var(--color-border)] text-[11px] font-label font-light tracking-[0.12em] text-[var(--color-text-primary)] uppercase"
        >
          Sanskrit Verse Input
        </label>
        
        <div className="flex gap-4">
          {availableVerses.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowExamples(!showExamples)}
                className="text-[11px] font-label font-light tracking-[0.12em] uppercase text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              >
                Load Example ↓
              </button>

              {showExamples && (
                <div className="absolute right-0 top-6 z-50 w-80 max-h-64 overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm p-3 rounded-[2px]">
                  {availableVerses.map((v, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleLoadExample(v)}
                      className="w-full text-left p-3 hover:bg-[var(--color-active)] transition-colors cursor-pointer rounded-[2px]"
                    >
                      <span className="text-base font-devanagari text-[var(--color-text-primary)] block leading-relaxed">
                        {v.devanagari || v.verse || v.text || `Verse ${i + 1}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {verse && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-label font-light tracking-[0.12em] uppercase text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              Clear ✕
            </button>
          )}
        </div>
      </div>

      <textarea
        id="verse-input"
        ref={textareaRef}
        value={verse}
        onChange={handleChange}
        placeholder="पश्यादित्यान् वसून् रुद्रान्..."
        rows={4}
        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2px] p-6 text-[22px] text-[var(--color-text-primary)] font-devanagari resize-none focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-muted)] placeholder:opacity-50 transition-colors"
        style={{ minHeight: '160px', lineHeight: '2' }}
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}
