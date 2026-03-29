'use client';

import { useAppStore } from '@/lib/store';

export default function EngineSettings() {
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const availableChandas = useAppStore((s) => s.availableChandas);
  const availableModes = useAppStore((s) => s.availableModes);

  return (
    <div className="flex flex-col gap-10">
      {/* ── Chanda Selector ──────────────────────────────────── */}
      <div>
        <label className="pb-1 border-b-[2px] border-[var(--color-border)] text-[11px] font-label font-light tracking-[0.12em] text-[var(--color-text-primary)] uppercase block mb-4">
          Chanda (Meter)
        </label>
        <div className="relative">
          <select
            id="chanda-select"
            value={settings.chanda}
            onChange={(e) => setSettings({ chanda: e.target.value })}
            className="w-full bg-transparent border-b border-[var(--color-border)] pb-2 pt-1 text-lg text-[var(--color-text-primary)] font-display appearance-none cursor-pointer focus:outline-none focus:border-[var(--color-accent)] transition-colors rounded-none"
          >
            {availableChandas.length > 0 ? (
              availableChandas.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))
            ) : (
              <>
                <option value="anushtubh">Anushtubh</option>
                <option value="mandakranta">Mandākrāntā</option>
              </>
            )}
          </select>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)] text-[10px] font-mono">
            ↓
          </div>
        </div>
      </div>

      {/* ── Melodic Mode ──────────────────────────────────────── */}
      <div>
        <label className="pb-1 border-b-[2px] border-[var(--color-border)] text-[11px] font-label font-light tracking-[0.12em] text-[var(--color-text-primary)] uppercase block mb-4">
          Melodic Mode
        </label>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setSettings({ melodic_mode: 'vedic' })}
            style={{ minHeight: '44px', padding: '0 16px' }}
            className={`cursor-pointer transition-colors flex items-center justify-center font-label tracking-wide uppercase text-sm ${
              settings.melodic_mode === 'vedic'
                ? 'text-[var(--color-accent)] border-b-[2px] border-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] border-b-[2px] border-transparent'
            }`}
          >
            Vedic
          </button>
          
          <div className="mx-2" style={{ width: '1px', height: '24px', background: 'var(--color-border)', alignSelf: 'center' }} />
          
          <button
            type="button"
            onClick={() => setSettings({ melodic_mode: 'raga_bhairavi' })}
            style={{ minHeight: '44px', padding: '0 16px' }}
            className={`cursor-pointer transition-colors flex items-center justify-center font-label tracking-wide uppercase text-sm ${
              settings.melodic_mode === 'raga_bhairavi'
                ? 'text-[var(--color-accent)] border-b-[2px] border-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] border-b-[2px] border-transparent'
            }`}
          >
            Rāga Bhairavī
          </button>
        </div>
      </div>

      {/* ── Base Pitch Slider ─────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="pb-1 border-b-[2px] border-[var(--color-border)] text-[11px] font-label font-light tracking-[0.12em] text-[var(--color-text-primary)] uppercase">
            Base Pitch
          </label>
          <span className="text-sm font-mono text-[var(--color-accent)] tabular-nums">
            {settings.base_pitch_hz} Hz
          </span>
        </div>
        <input
          id="pitch-slider"
          type="range"
          min={80}
          max={300}
          step={5}
          value={settings.base_pitch_hz}
          onChange={(e) => setSettings({ base_pitch_hz: Number(e.target.value) })}
        />
        <div className="flex justify-between mt-2">
          <span className="text-[10px] font-mono text-[var(--color-text-muted)]">80Hz</span>
          <span className="text-[10px] font-mono text-[var(--color-text-muted)]">300Hz</span>
        </div>
      </div>
    </div>
  );
}
