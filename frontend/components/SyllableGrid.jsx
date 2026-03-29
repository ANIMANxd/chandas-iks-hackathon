'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';

export default function SyllableGrid() {
  const analysisResult = useAppStore((s) => s.analysisResult);
  const synthesisResult = useAppStore((s) => s.synthesisResult);
  const currentPlaybackTimeMs = useAppStore((s) => s.currentPlaybackTimeMs);
  const isPlaying = useAppStore((s) => s.isPlaying);

  const result = synthesisResult || analysisResult;

  const activeSyllableIndex = useMemo(() => {
    if (!isPlaying || !synthesisResult?.planned || currentPlaybackTimeMs <= 0) {
      return -1;
    }
    let elapsed = 0;
    for (let i = 0; i < synthesisResult.planned.length; i++) {
      elapsed += synthesisResult.planned[i].duration_ms;
      if (currentPlaybackTimeMs < elapsed) return i;
    }
    return -1;
  }, [currentPlaybackTimeMs, isPlaying, synthesisResult]);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] border border-[var(--color-border)] opacity-30">
        <div className="text-3xl mb-4 font-display">◆</div>
        <p className="text-[11px] text-[var(--color-text-muted)] font-label uppercase tracking-[0.12em] font-light">
          Awaiting input
        </p>
      </div>
    );
  }

  const syllables = result.syllables || [];
  const violations = result.chanda_violations || [];
  const lgString = result.lg_string || '';

  return (
    <div className="flex flex-col gap-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b-[2px] border-[var(--color-border)] pb-2 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-[6px] h-[6px] rounded-full bg-[var(--color-accent)]" />
          <span className="text-[11px] font-label font-light tracking-[0.12em] text-[var(--color-text-primary)] uppercase">
            Prosodic Grid
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--color-text-muted)]">
          <span>{result.syllable_count} syllables</span>
          <span className="opacity-50">|</span>
          <span className={result.chanda_valid ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-accent)]'}>
            {result.chanda_valid ? 'Valid Match' : 'Violations Found'}
          </span>
        </div>
      </div>

      {/* ── Display String ── */}
      <div>
        <span className="text-[10px] font-label font-light tracking-[0.12em] text-[var(--color-text-muted)] uppercase block mb-2">
          Pattern
        </span>
        <span className="text-sm font-mono tracking-[0.3em] text-[var(--color-text-primary)]">
          {lgString.split('').map((ch, i) => (
            <span
              key={i}
              className={ch === 'G' ? 'font-bold' : 'text-[var(--color-text-muted)]'}
            >
              {ch}
            </span>
          ))}
        </span>
      </div>

      {/* ── Blocks ── */}
      <div className="flex flex-wrap gap-[1px] bg-[var(--color-border)] border border-[var(--color-border)] p-[1px]">
        {syllables.map((syl, i) => {
          const isGuru = syl.weight === 'G';
          const isViolation = violations.some(
            (v) => v.toLowerCase().includes(`position ${syl.position}`) || v.toLowerCase().includes(syl.text.toLowerCase())
          );
          const isActive = i === activeSyllableIndex;

          return (
            <div
              key={`${syl.position}-${syl.text}`}
              className={`relative flex flex-col items-center justify-center p-4 transition-colors duration-200 cursor-default
                ${isGuru ? 'min-w-[80px]' : 'min-w-[48px]'}
                ${isActive ? 'bg-[var(--color-active)]' : 'bg-[var(--color-surface)]'}
                ${isViolation ? 'border-b-2 border-[var(--color-accent)]' : ''}
              `}
              title={syl.reason}
            >
              <span
                className={`text-xl font-mono leading-none ${
                  isGuru ? 'font-bold text-[var(--color-text-primary)]' : 'font-normal text-[var(--color-text-muted)]'
                }`}
              >
                {syl.text}
              </span>
              <span className={`text-[9px] font-mono mt-2 ${
                  isGuru ? 'font-bold text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
                }`}
              >
                {syl.weight}
              </span>
              
              {isActive && (
                <div className="absolute top-2 right-2 w-[4px] h-[4px] bg-[var(--color-accent)] rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Ganas ── */}
      {result.ganas && result.ganas.length > 0 && (
        <div className="pt-2 border-t border-[var(--color-border)]">
          <span className="text-[10px] font-label font-light tracking-[0.12em] text-[var(--color-text-muted)] uppercase block mb-3">
            Gaṇa Groupings
          </span>
          <div className="flex flex-wrap gap-2">
            {result.ganas.map((g, i) => (
              <div key={i} className="flex items-center gap-2 border border-[var(--color-border)] px-3 py-1.5 bg-[var(--color-surface)]">
                <span className="text-[12px] font-display font-bold">{g.name}</span>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)]">| {g.pattern}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
