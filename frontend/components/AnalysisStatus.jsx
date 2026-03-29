'use client';

import { useAppStore } from '@/lib/store';

export default function AnalysisStatus() {
  const analysisResult = useAppStore((s) => s.analysisResult);
  const analysisError = useAppStore((s) => s.analysisError);
  const verse = useAppStore((s) => s.verse);

  if (!verse.trim() && !analysisResult && !analysisError) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Analysis Error ── */}
      {analysisError && (
        <div className="p-4 border-l-2 border-[var(--color-accent)] bg-[var(--color-surface)]">
          <p className="text-xs font-mono text-[var(--color-accent)] uppercase tracking-wider">
            Input Validation Error
          </p>
          <p className="text-sm font-mono text-[var(--color-text-primary)] mt-1">{analysisError}</p>
        </div>
      )}

      {/* ── IAST Transliteration ── */}
      {analysisResult?.verse_iast && (
        <div className="pb-4">
          <label className="pb-1 border-b-[2px] border-[var(--color-border)] text-[11px] font-label font-light tracking-[0.12em] text-[var(--color-text-primary)] uppercase block mb-3">
            Roman Transliteration (IAST)
          </label>
          <p className="text-sm font-label font-light uppercase tracking-widest leading-loose text-[var(--color-text-primary)]">
            {analysisResult.verse_iast}
          </p>

          {/* Violations */}
          {analysisResult.chanda_violations?.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
              <span className="text-[10px] font-label font-light tracking-[0.12em] text-[var(--color-accent)] uppercase block mb-2">
                Prosodic Violations Detected
              </span>
              <ul className="flex flex-col gap-1.5">
                {analysisResult.chanda_violations.map((v, i) => (
                  <li key={i} className="text-[12px] font-mono text-[var(--color-text-primary)] border border-[var(--color-border)] px-3 py-1 bg-[var(--color-surface)]">
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
