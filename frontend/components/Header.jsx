'use client';

export default function Header() {
  return (
    <header className="w-full border-b border-[var(--color-border)] px-6 sm:px-12 py-8 shrink-0">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between">
        <div className="flex items-baseline gap-4">
          <h1 className="text-3xl font-display text-[var(--color-text-primary)] tracking-wide leading-none m-0">
            Chandas
          </h1>
          <p className="text-[12px] font-label font-light tracking-[0.12em] text-[var(--color-text-muted)] uppercase mt-1">
            Prosody Engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] font-mono text-[var(--color-text-muted)]">
            v2.0 / Strict Layout
          </span>
        </div>
      </div>
    </header>
  );
}
