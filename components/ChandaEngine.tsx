'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import SyllableGrid from './SyllableGrid'
import Toast, { ToastHandle } from './Toast'
import { AnalysisResult, SynthesisResult, Syllable, Gana, PlannedItem } from '@/lib/types'

const API = 'http://localhost:8000'

const CHANDA_OPTIONS = [
  { value: 'anushtubh', label: 'Anushtubh · अनुष्टुभ्' },
  { value: 'mandakranta', label: 'Mandakranta · मन्दाक्रान्ता' },
]

const MODE_OPTIONS = [
  { value: 'vedic', name: 'Vedic', desc: '3-level accents' },
  { value: 'raga_bhairavi', name: 'Bhairavi', desc: 'Raga contour' },
]

type PanelKey = 'analysis' | 'playback' | 'annotation'

export default function ChandaEngine() {
  // ── State ──
  const [verse, setVerse] = useState('')
  const [chanda, setChanda] = useState('anushtubh')
  const [mode, setMode] = useState('vedic')
  const [pitch, setPitch] = useState(120)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [activePanel, setActivePanel] = useState<PanelKey>('analysis')
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [synthesisResult, setSynthesisResult] = useState<SynthesisResult | null>(null)
  const [verseClass, setVerseClass] = useState('')
  const [waveBars, setWaveBars] = useState<number[]>([])
  const [waveProgress, setWaveProgress] = useState(0)
  const [timeDisplay, setTimeDisplay] = useState('0.0 / 0.0')
  const [activePos, setActivePos] = useState<number>(-1)
  const [chandaOptions, setChandaOptions] = useState(CHANDA_OPTIONS)
  const [modeOptions, setModeOptions] = useState(MODE_OPTIONS)

  // ── Refs ──
  const toastRef = useRef<ToastHandle>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const analyzeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const plannedRef = useRef<PlannedItem[]>([])

  // ── Theme effect ──
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '')
  }, [theme])

  // ── Health check on mount ──
  useEffect(() => {
    checkHealth()
  }, [])

  async function checkHealth() {
    try {
      const res = await fetch(`${API}/api/v1/health`)
      const d = await res.json()
      if (d.status === 'ok') {
        if (d.supported_chandas) {
          setChandaOptions(
            d.supported_chandas.map((c: string) => ({
              value: c,
              label: c.charAt(0).toUpperCase() + c.slice(1),
            }))
          )
        }
        if (d.supported_modes) {
          setModeOptions(
            d.supported_modes.map((m: string, i: number) => ({
              value: m,
              name: m,
              desc: m === 'vedic' ? '3-level accents' : 'Raga contour',
            }))
          )
        }
      }
    } catch {
      // engine offline — silent
    }
  }

  // ── Verse input + debounced analyze ──
  function handleVerseChange(val: string) {
    setVerse(val)
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current)
    analyzeTimerRef.current = setTimeout(() => doAnalyze(val, chanda), 500)
  }

  function handleChandaChange(val: string) {
    setChanda(val)
    if (verse.trim()) {
      if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current)
      analyzeTimerRef.current = setTimeout(() => doAnalyze(verse, val), 500)
    }
  }

  async function doAnalyze(v: string, c: string) {
    if (!v.trim()) { resetAnalysis(); return }
    try {
      const res = await fetch(`${API}/api/v1/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verse: v, chanda: c }),
      })
      const d: AnalysisResult = await res.json()
      setAnalysisResult(d)
      setVerseClass(d.chanda_valid ? 'valid-border' : 'error-border')
    } catch {
      // silently fail
    }
  }

  function resetAnalysis() {
    setAnalysisResult(null)
    setVerseClass('')
  }

  // ── Example verse ──
  async function handleExample() {
    try {
      const res = await fetch(`${API}/api/v1/verses`)
      const d = await res.json()
      const verses = Array.isArray(d) ? d : (d.verses || [])
      if (verses.length) {
        const v = verses[Math.floor(Math.random() * verses.length)]
        const text = v.devanagari || v.verse || v
        setVerse(text)
        doAnalyze(text, chanda)
        return
      }
    } catch {/* fall through */}
    const fallback = 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन'
    setVerse(fallback)
    doAnalyze(fallback, chanda)
  }

  // ── Synthesize ──
  async function handleSynthesize(e: React.MouseEvent<HTMLButtonElement>) {
    if (isSynthesizing || !verse.trim()) return
    // ripple
    const btn = e.currentTarget
    const r = document.createElement('span')
    r.className = 'ripple-el'
    const rect = btn.getBoundingClientRect()
    r.style.left = (e.clientX - rect.left) + 'px'
    r.style.top = (e.clientY - rect.top) + 'px'
    btn.appendChild(r)
    r.addEventListener('animationend', () => r.remove())

    setIsSynthesizing(true)
    try {
      const res = await fetch(`${API}/api/v1/recite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verse, chanda, melodic_mode: mode, base_pitch_hz: pitch }),
      })
      const d: SynthesisResult = await res.json()
      setSynthesisResult(d)
      renderSynthesis(d)
      toastRef.current?.show('Synthesis complete')
      setActivePanel('playback')
    } catch {
      toastRef.current?.show('Synthesis failed — is backend running?')
    } finally {
      setIsSynthesizing(false)
    }
  }

  function renderSynthesis(d: SynthesisResult) {
    if (audioRef.current) {
      audioRef.current.src = d.audio_url || ''
      audioRef.current.load()
    }
    const bars: number[] = []
    for (let i = 0; i < 48; i++) bars.push(20 + Math.random() * 80)
    setWaveBars(bars)
    const totalSec = (d.total_duration_ms || 0) / 1000
    setTimeDisplay(`0.0 / ${totalSec.toFixed(1)}`)
    plannedRef.current = d.planned || []
    setWaveProgress(0)
    setActivePos(-1)
  }

  // ── Playback ──
  function handlePlayPause() {
    const audio = audioRef.current
    if (!audio || !audio.src) return
    if (audio.paused) {
      audio.play()
      setIsPlaying(true)
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  function handleTimeUpdate() {
    const audio = audioRef.current
    if (!audio) return
    const curr = audio.currentTime
    const dur = audio.duration || 1
    const pct = (curr / dur) * 100
    setWaveProgress(pct)
    setTimeDisplay(`${curr.toFixed(1)} / ${(audio.duration || 0).toFixed(1)}`)

    const currMs = curr * 1000
    const planned = plannedRef.current
    let accMs = 0
    let ap = -1
    for (const p of planned) {
      accMs += p.duration_ms || 0
      if (currMs < accMs) { ap = p.position; break }
    }
    setActivePos(ap)
  }

  function handleAudioEnded() {
    setIsPlaying(false)
    setWaveProgress(0)
    setActivePos(-1)
  }

  // ── Radial hover on .btn ──
  function handleBtnMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const btn = e.currentTarget
    const r = btn.getBoundingClientRect()
    btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%')
    btn.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%')
  }

  // ── LG string rendering ──
  function renderLgHtml(lgString: string) {
    return (lgString || '').split(' ').map((s, i) => (
      <span key={i} className={s}>{s} </span>
    ))
  }

  const playedBarCount = Math.floor((waveProgress / 100) * 48)

  return (
    <>
      <div className="shell">
        {/* ── Header ── */}
        <header className="header">
          <div className="wordmark">
            <div className="wordmark-glyph">छ</div>
            <div className="wordmark-text">
              <span className="wordmark-title">ChandaEngine</span>
              <span className="wordmark-sub">Sanskrit Prosody · वेद शास्त्र</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="theme-btn"
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀' : '☽'}
            </button>
          </div>
        </header>

        {/* ── Sidebar ── */}
        <aside className="sidebar">

          {/* Verse Input */}
          <div>
            <div className="section-label">Verse · श्लोक</div>
            <textarea
              className={`verse-textarea ${verseClass}`}
              rows={4}
              placeholder="कर्मण्येवाधिकारस्ते…"
              spellCheck={false}
              value={verse}
              onChange={e => handleVerseChange(e.target.value)}
            />
            <div className="verse-actions">
              <button
                className="btn"
                onMouseMove={handleBtnMouseMove}
                onClick={() => { setVerse(''); resetAnalysis() }}
              >
                Clear
              </button>
              <button
                className="btn"
                onMouseMove={handleBtnMouseMove}
                onClick={handleExample}
              >
                Example
              </button>
            </div>
          </div>

          {/* Settings */}
          <div>
            <div className="section-label">Settings · विन्यास</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div className="field">
                <label>Chanda (Meter) · छन्द</label>
                <select
                  className="chanda-select"
                  value={chanda}
                  onChange={e => handleChandaChange(e.target.value)}
                >
                  {chandaOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Melodic Mode · स्वर पद्धति</label>
                <div className="mode-cards">
                  {modeOptions.map(m => (
                    <button
                      key={m.value}
                      className={`mode-card${mode === m.value ? ' active' : ''}`}
                      onClick={() => setMode(m.value)}
                    >
                      <span className="mode-card-name">{m.name}</span>
                      <span className="mode-card-desc">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Base Pitch · मूल स्वर</label>
                <input
                  type="range"
                  className="pitch-slider"
                  min={80}
                  max={300}
                  value={pitch}
                  onChange={e => setPitch(+e.target.value)}
                />
                <div className="pitch-display">{pitch} Hz</div>
              </div>

            </div>
          </div>

          {/* CTA */}
          <div>
            <button
              className={`btn btn-primary${isSynthesizing ? ' loading' : ''}`}
              disabled={isSynthesizing}
              onClick={handleSynthesize}
            >
              <span className="btn-text">Synthesize &amp; Recite</span>
              <span className="btn-spinner"><span className="spinner-ring" /></span>
            </button>
          </div>

        </aside>

        {/* ── Main Canvas ── */}
        <main className="main-canvas">
          <div className="tabs">
            {(['analysis', 'playback', 'annotation'] as PanelKey[]).map(p => (
              <button
                key={p}
                className={`tab${activePanel === p ? ' active' : ''}`}
                onClick={() => setActivePanel(p)}
              >
                {p === 'analysis' && 'Analysis · विश्लेषण'}
                {p === 'playback' && 'Playback · श्रवण'}
                {p === 'annotation' && 'Annotation · टिप्पणी'}
              </button>
            ))}
          </div>

          <div className="canvas-body">

            {/* ── Analysis Panel ── */}
            <div className={`panel${activePanel === 'analysis' ? ' active' : ''}`}>
              {!analysisResult ? (
                <div className="empty">
                  <div className="empty-glyph">ॐ</div>
                  <div className="empty-label">Enter a verse to begin analysis</div>
                </div>
              ) : (
                <div>
                  <div className="analysis-meta">
                    <div className="meta-item">
                      <span className="meta-key">Syllables · अक्षर</span>
                      <span className="meta-val">{analysisResult.syllable_count ?? '—'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-key">Meter · छन्द</span>
                      <span className="meta-val">{analysisResult.chanda ?? '—'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-key">Score · अंक</span>
                      <span className={`meta-val${(analysisResult.chanda_score ?? 0) >= 0.8 ? ' valid' : ' invalid'}`}>
                        {analysisResult.chanda_score !== undefined
                          ? (analysisResult.chanda_score * 100).toFixed(0) + '%'
                          : '—'}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-key">Valid · मान्य</span>
                      <span className={`meta-val${analysisResult.chanda_valid ? ' valid' : ' invalid'}`}>
                        {analysisResult.chanda_valid ? 'Yes · हाँ' : 'No · नहीं'}
                      </span>
                    </div>
                  </div>

                  <div className="iast-row">{analysisResult.verse_iast || ''}</div>

                  <div className="grid-label">
                    Prosodic Grid — <span style={{ color: 'var(--laghu)' }}>L</span> Laghu (1 mātrā) · <span style={{ color: 'var(--guru)' }}>G</span> Guru (2 mātrā)
                  </div>

                  <SyllableGrid
                    id="syllableGrid"
                    syllables={analysisResult.syllables || []}
                    ganas={analysisResult.ganas || []}
                    violations={analysisResult.chanda_violations || []}
                  />

                  <div className="lg-raw">
                    {renderLgHtml(analysisResult.lg_string || '')}
                  </div>

                  {!analysisResult.chanda_valid &&
                    analysisResult.chanda_violations &&
                    analysisResult.chanda_violations.length > 0 && (
                      <div>
                        <div className="grid-label" style={{ marginBottom: 8, marginTop: 4 }}>
                          Violations · दोष
                        </div>
                        <div className="violations">
                          {analysisResult.chanda_violations.map((v, i) => (
                            <div key={i} className="violation">
                              {typeof v === 'string' ? v : JSON.stringify(v)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* ── Playback Panel ── */}
            <div className={`panel${activePanel === 'playback' ? ' active' : ''}`}>
              {!synthesisResult ? (
                <div className="empty">
                  <div className="empty-glyph">ॐ</div>
                  <div className="empty-label">Synthesize to enable playback</div>
                </div>
              ) : (
                <div>
                  <div className="playback-deck">
                    <div className="playback-title">Audio Playback · ध्वनि</div>
                    <div className="audio-controls">
                      <button className="play-btn" onClick={handlePlayPause}>
                        {isPlaying ? '⏸' : '▶'}
                      </button>
                      <div className="waveform-mock">
                        <div className="waveform-progress" style={{ width: `${waveProgress}%` }} />
                        <div className="waveform-bars">
                          {waveBars.map((h, i) => (
                            <div
                              key={i}
                              className={`waveform-bar${i < playedBarCount ? ' played' : ''}`}
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="time-display">{timeDisplay}</div>
                    </div>
                  </div>
                  <div className="grid-label" style={{ marginTop: 8 }}>
                    Karaoke Sync · अनुसरण
                  </div>
                  <SyllableGrid
                    id="playbackGrid"
                    syllables={synthesisResult.syllables || []}
                    ganas={synthesisResult.ganas || []}
                    violations={[]}
                    activePos={activePos}
                  />
                  <audio
                    ref={audioRef}
                    style={{ display: 'none' }}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleAudioEnded}
                  />
                </div>
              )}
            </div>

            {/* ── Annotation Panel ── */}
            <div className={`panel${activePanel === 'annotation' ? ' active' : ''}`}>
              {!synthesisResult ? (
                <div className="empty">
                  <div className="empty-glyph">ग</div>
                  <div className="empty-label">No annotation yet</div>
                </div>
              ) : (
                <div>
                  <div className="section-label" style={{ marginBottom: 12 }}>
                    Engine Annotation · भाष्य
                  </div>
                  <div className="annotation-box">
                    {synthesisResult.annotation || '(No annotation)'}
                  </div>
                  <div className="divider"><span>✦</span></div>
                  <div className="section-label" style={{ marginBottom: 12 }}>
                    Timing Table · कालक्रम
                  </div>
                  <div className="annotation-box">
                    {synthesisResult.timing_table || '(No timing table)'}
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      <Toast ref={toastRef} />
    </>
  )
}
