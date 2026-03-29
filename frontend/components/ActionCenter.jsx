'use client';

import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';

export default function ActionCenter() {
  const verse = useAppStore((s) => s.verse);
  const isSynthesizing = useAppStore((s) => s.isSynthesizing);
  const synthesizeVerse = useAppStore((s) => s.synthesizeVerse);
  const analysisResult = useAppStore((s) => s.analysisResult);
  const synthesisError = useAppStore((s) => s.synthesisError);

  const canSynthesize = verse.trim().length > 0 && !isSynthesizing;

  return (
    <div className="mt-4">
      {/* ── Synthesize FAB ──────────────────────────────────────── */}
      <button
        id="synthesize-btn"
        type="button"
        disabled={!canSynthesize}
        onClick={synthesizeVerse}
        className={`
          w-full py-4 rounded-none font-label uppercase tracking-widest text-sm font-light
          transition-colors duration-300 ease-in-out cursor-pointer
          ${
            canSynthesize
              ? 'bg-[var(--color-text-primary)] text-[var(--color-base)] hover:bg-[var(--color-accent)]'
              : 'bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed'
          }
        `}
      >
        {isSynthesizing ? (
          <div className="flex items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-4 h-4 border-2 border-[var(--color-base)] border-t-transparent rounded-full"
            />
            <span>Synthesizing...</span>
          </div>
        ) : (
          <span>Synthesize & Recite</span>
        )}
      </button>

      {/* ── Synthesis Error ─────────────────────────────────────── */}
      {synthesisError && (
        <div className="mt-4 p-4 border border-[var(--color-accent)]">
          <p className="text-xs font-mono text-[var(--color-accent)]">{synthesisError}</p>
        </div>
      )}

      {/* ── Quick stats row ─────────────────────────────────────── */}
      {analysisResult && (
        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-6 mt-8">
          <Stat label="Syllables" value={analysisResult.syllable_count} />
          <Stat
            label="Confidence"
            value={`${(analysisResult.chanda_score * 100).toFixed(0)}%`}
          />
          <Stat label="Matched Meter" value={analysisResult.chanda} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-left">
      <div className="text-[10px] font-label font-light tracking-[0.12em] text-[var(--color-text-muted)] uppercase mb-1">
        {label}
      </div>
      <div className="text-base font-display text-[var(--color-text-primary)]">
        {value}
      </div>
    </div>
  );
}
