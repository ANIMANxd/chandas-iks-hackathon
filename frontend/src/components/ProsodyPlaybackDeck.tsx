"use client";

import React from 'react';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';

export const ProsodyPlaybackDeck = () => {
  const { synthesisResult, currentPlaybackTimeMs, setCurrentPlaybackTimeMs } = useStore();

  if (!synthesisResult) return null;

  const toAbsoluteUrl = (url: string) => {
    return url.startsWith('http') ? url : 'http://localhost:8000' + url;
  };

  const audioUrl = toAbsoluteUrl(synthesisResult.audio_url);

  // Calculate which syllable is currently active based on cumulative duration
  let cumTime = 0;
  const activeIndex = synthesisResult.planned.findIndex((syl) => {
    const start = cumTime;
    const end = cumTime + syl.duration_ms;
    cumTime = end;
    return currentPlaybackTimeMs >= start && currentPlaybackTimeMs < end;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-full relative overflow-hidden flex flex-col justify-start"
    >
      <div className="relative z-10 flex justify-between items-center mb-4 shrink-0">
        <h2 className="text-sm font-mono text-primary font-bold tracking-wider uppercase opacity-80 flex items-center gap-2">
            <span>{'♪'}</span> Audio Matrix
        </h2>
        <div className="flex gap-4 font-mono text-xs text-primary/50 uppercase tracking-widest">
            <span>{synthesisResult.chanda_type}</span>
            <span>{synthesisResult.melodic_mode}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1 pb-4">
        {/* Syllable Karaoke Highlight */}
        <div className="relative z-10 flex flex-wrap gap-2 justify-center py-2 shrink-0">
          {synthesisResult.planned.map((syl, i) => {
            const isActive = i === activeIndex;
            const isGuru = syl.weight === 'G';
            return (
              <div 
                key={i}
                className={`transition-all duration-150 flex flex-col items-center gap-1 ${isActive ? 'scale-125 mx-2 shadow-[0_0_20px_rgba(224,230,237,0.2)]' : 'opacity-50 grayscale'}`}
              >
                <span className={`font-devanagari text-2xl ${isActive ? (isGuru ? 'text-guru' : 'text-laghu') : 'text-primary'}`}>
                  {syl.text}
                </span>
                <span className="text-[10px] font-mono text-primary/40">
                  {Math.round(syl.pitch_hz)}Hz
                </span>
              </div>
            )
          })}
        </div>
        
        {/* Prosody Visualization Image */}
        {synthesisResult.visualization_url && (
          <div className="w-full h-full flex flex-col items-start gap-2 pt-2 border-t border-[#2a2d3d] mt-2">
             <h4 className="font-mono text-primary/50 text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <span>{'[X]'}</span> Pitch Curve & Waveform Visualizer
             </h4>
             <div className="w-full flex-1 bg-[#0a0c12] border border-[#2a2d3d] rounded-xl overflow-hidden shadow-inner flex justify-center items-center p-2 min-h-[160px]">
               <img 
                 src={synthesisResult.visualization_url.startsWith('http') ? synthesisResult.visualization_url : 'http://localhost:8000' + synthesisResult.visualization_url} 
                 alt="Prosody pitch contour visualization"
                 className="w-full h-full object-contain filter brightness-110 saturate-[1.2] opacity-90 hover:opacity-100 transition-opacity"
               />
             </div>
          </div>
        )}

        {/* Single-Track Audio Playback */}
        <div className="w-full flex flex-col items-start gap-2 pt-2 border-t border-[#2a2d3d] mt-2">
          <div className="w-full bg-[#161b22] border border-[#2a2d3d] rounded-xl p-3 shadow-inner">
            <h5 className="font-mono text-[11px] text-primary uppercase tracking-[0.14em] flex items-center gap-2">
              <span className="text-[#45A29E]">{'[>]'}</span> AUDIO PLAYBACK (SARVAM AI)
            </h5>
            <p className="text-[11px] text-primary/55 mt-1 mb-3">
              Baseline acoustic model with flawless phonetic rendering.
            </p>
            <div className="rounded-lg border border-[#30374a] bg-[#0d1117] p-2">
              <audio
                controls
                className="w-full h-10 accent-[#45A29E]"
                src={audioUrl}
                onTimeUpdate={(e) => setCurrentPlaybackTimeMs(e.currentTarget.currentTime * 1000)}
                onEnded={() => setCurrentPlaybackTimeMs(0)}
              />
            </div>
          </div>
        </div>
      </div>

    </motion.div>
  );
};
