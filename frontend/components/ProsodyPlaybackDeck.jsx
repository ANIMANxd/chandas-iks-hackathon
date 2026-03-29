'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function ProsodyPlaybackDeck() {
  const synthesisResult = useAppStore((s) => s.synthesisResult);
  const setCurrentPlaybackTimeMs = useAppStore((s) => s.setCurrentPlaybackTimeMs);
  const setIsPlaying = useAppStore((s) => s.setIsPlaying);

  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  const audioUrl = synthesisResult?.audio_url
    ? api.getFullUrl(synthesisResult.audio_url)
    : null;
  const vizUrl = synthesisResult?.visualization_url
    ? api.getFullUrl(synthesisResult.visualization_url)
    : null;

  useEffect(() => {
    if (!audioUrl || !waveformRef.current) return;
    let ws = null;
    const initWaveSurfer = async () => {
      const WaveSurfer = (await import('wavesurfer.js')).default;
      ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#E2DDD4', // var(--color-border) essentially
        progressColor: '#1A1208', // var(--color-text-primary)
        cursorColor: '#8B4513', // var(--color-accent)
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 0,
        height: 80,
        responsive: true,
        normalize: true,
        backend: 'WebAudio',
      });

      ws.on('ready', () => {
        setReady(true);
        setDuration(ws.getDuration());
      });

      ws.on('audioprocess', () => {
        const t = ws.getCurrentTime() * 1000;
        setCurrentTime(ws.getCurrentTime());
        setCurrentPlaybackTimeMs(t);
      });

      ws.on('play', () => {
        setPlaying(true);
        setIsPlaying(true);
      });

      ws.on('pause', () => {
        setPlaying(false);
        setIsPlaying(false);
      });

      ws.on('finish', () => {
        setPlaying(false);
        setIsPlaying(false);
        setCurrentPlaybackTimeMs(0);
      });

      ws.on('seeking', () => {
        const t = ws.getCurrentTime() * 1000;
        setCurrentTime(ws.getCurrentTime());
        setCurrentPlaybackTimeMs(t);
      });

      ws.load(audioUrl);
      wavesurferRef.current = ws;
    };

    initWaveSurfer();

    return () => {
      if (ws) {
        ws.destroy();
      }
      wavesurferRef.current = null;
      setReady(false);
      setPlaying(false);
      setIsPlaying(false);
    };
  }, [audioUrl]);

  const togglePlayPause = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!synthesisResult) return null;

  return (
    <div className="relative border border-[var(--color-border)] bg-[var(--color-surface)] mb-10 overflow-hidden">
      {/* ── Visualization Background ── */}
      {vizUrl && (
        <div className="absolute inset-0 z-0 border-b border-[var(--color-border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={vizUrl}
            alt="Pitch visualization"
            className="w-full h-[60px] object-cover opacity-20 filter grayscale"
          />
        </div>
      )}

      <div className="relative z-10 p-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <label className="text-[11px] font-label font-light tracking-[0.12em] text-[var(--color-text-primary)] uppercase block">
            Acoustic Recitation playback
          </label>
          {synthesisResult.processing_time_ms && (
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
              Latency: {(synthesisResult.processing_time_ms / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        {/* ── Waveform ── */}
        <div
          ref={waveformRef}
          className="mb-8 border-b border-[var(--color-border)] pb-4"
          style={{ minHeight: '80px' }}
        />

        {/* ── Controls ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={togglePlayPause}
              disabled={!ready}
              className={`
                w-12 h-12 flex items-center justify-center cursor-pointer transition-colors
                ${
                  ready
                    ? 'bg-[var(--color-text-primary)] text-[var(--color-base)] hover:bg-[var(--color-accent)]'
                    : 'bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed'
                }
              `}
            >
              {playing ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="ml-0.5"
                >
                  <path d="M8 5.14v14l11-7z" />
                </svg>
              )}
            </button>

            <div className="font-mono text-sm tracking-wide tabular-nums text-[var(--color-text-primary)]">
              {formatTime(currentTime)} <span className="text-[var(--color-text-muted)] mx-1">/</span> {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-[10px] font-mono bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-text-primary)]">
              {synthesisResult.melodic_mode}
            </span>
          </div>
        </div>

        {/* ── Timing ── */}
        {synthesisResult.planned && synthesisResult.planned.length > 0 && (
          <div className="mt-8 pt-4 border-t border-[var(--color-border)]">
            <div className="flex gap-0 overflow-x-auto">
              {synthesisResult.planned.map((p, i) => {
                const totalMs = synthesisResult.total_duration_ms || 1;
                const widthPct = (p.duration_ms / totalMs) * 100;
                const isGuru = p.weight === 'G';

                return (
                  <div
                    key={i}
                    className={`
                      flex-shrink-0 h-6 border-r border-[var(--color-border)] flex items-center justify-center
                      text-[10px] font-mono
                      ${isGuru ? 'font-bold text-[var(--color-text-primary)] bg-[var(--color-border)]' : 'text-[var(--color-text-muted)] bg-[var(--color-surface)]'}
                    `}
                    style={{ width: `${Math.max(widthPct, 2)}%`, minWidth: '16px' }}
                    title={`${p.text} (${p.weight}) — ${p.duration_ms}ms @ ${p.pitch_hz}Hz`}
                  >
                    {p.text}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
