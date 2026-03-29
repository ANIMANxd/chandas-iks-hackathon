'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import Header from '@/components/Header';
import VerseInputArea from '@/components/VerseInputArea';
import EngineSettings from '@/components/EngineSettings';
import ActionCenter from '@/components/ActionCenter';
import SyllableGrid from '@/components/SyllableGrid';
import ProsodyPlaybackDeck from '@/components/ProsodyPlaybackDeck';
import AnalysisStatus from '@/components/AnalysisStatus';

export default function HomePage() {
  const initializeApp = useAppStore((s) => s.initializeApp);
  const isSynthesizing = useAppStore((s) => s.isSynthesizing);
  const synthesisResult = useAppStore((s) => s.synthesisResult);

  const [mounted, setMounted] = useState(false);
  const [progressState, setProgressState] = useState({ w: '0%', op: 0, dur: '3s' });

  useEffect(() => {
    initializeApp();
    setMounted(true);
  }, [initializeApp]);

  // Synthesis progress line handler
  useEffect(() => {
    if (isSynthesizing) {
      setProgressState({ w: '85%', op: 1, dur: '5s' }); // smooth crawl
    } else {
      setProgressState({ w: '100%', op: 1, dur: '0.2s' }); // snap to end
      const fadeTid = setTimeout(() => {
        setProgressState((prev) => ({ ...prev, op: 0 }));
        const resetTid = setTimeout(() => {
          setProgressState({ w: '0%', op: 0, dur: '0s' });
        }, 300); // wait for opacity to clear before reset
        return () => clearTimeout(resetTid);
      }, 400); // pause at 100% briefly
      return () => clearTimeout(fadeTid);
    }
  }, [isSynthesizing]);

  return (
    <div
      className="flex flex-col h-[100vh] w-full min-h-[100vh] overflow-hidden transition-opacity duration-400 ease-out"
      style={{ opacity: mounted ? 1 : 0 }}
    >
      <Header />

      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row max-w-[1800px] w-full mx-auto relative">
        {/* ── Control Deck (Left Pane) ─────────────────────────── */}
        <section className="flex-1 lg:max-w-[45%] h-full overflow-y-auto w-full border-b border-[var(--color-border)] lg:border-b-0 lg:border-r p-6 sm:p-12 pb-24 lg:pb-12 custom-scroll">
          <div className="flex flex-col gap-10 max-w-xl mx-auto xl:mr-10 xl:ml-auto w-full">
            <VerseInputArea />
            <EngineSettings />
            <ActionCenter />
          </div>
        </section>

        {/* ── Analysis Canvas (Right Pane) ─────────────────────── */}
        <section className="flex-1 relative h-full overflow-y-auto w-full bg-[var(--color-surface)] p-6 sm:p-12 pb-32 lg:pb-12 custom-scroll">
          {/* Progress Line */}
          <div className="absolute top-0 left-0 w-full h-[1px] z-10 pointer-events-none">
            <div
              className="h-full bg-[var(--color-accent)]"
              style={{
                width: progressState.w,
                opacity: progressState.op,
                transition: `width ${progressState.dur} cubic-bezier(0.1, 0.7, 0.1, 1), opacity 0.3s ease`,
              }}
            />
          </div>

          <div className="flex flex-col gap-10 max-w-4xl mx-auto xl:ml-10 xl:mr-auto w-full">
            <AnalysisStatus />
            <SyllableGrid />
            {synthesisResult && <ProsodyPlaybackDeck />}
          </div>
        </section>
      </main>
    </div>
  );
}
