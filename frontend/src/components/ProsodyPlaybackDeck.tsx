"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProsodyPlaybackDeck = () => {
  const { synthesisResult, currentPlaybackTimeMs, setCurrentPlaybackTimeMs } = useStore();
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!synthesisResult || !waveformRef.current) return;

    // We make sure the URL is absolute if it's relative
    const audioUrl = synthesisResult.audio_url.startsWith('http') 
      ? synthesisResult.audio_url 
      : `http://localhost:8000${synthesisResult.audio_url}`;

    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(224, 230, 237, 0.2)',
      progressColor: '#45A29E',
      cursorColor: '#F2A900',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 80,
      url: audioUrl,
    });

    wavesurferRef.current.on('audioprocess', (currentTime) => {
      setCurrentPlaybackTimeMs(currentTime * 1000);
    });

    wavesurferRef.current.on('play', () => setIsPlaying(true));
    wavesurferRef.current.on('pause', () => setIsPlaying(false));
    wavesurferRef.current.on('finish', () => setIsPlaying(false));

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [synthesisResult, setCurrentPlaybackTimeMs]);

  if (!synthesisResult) return null;

  const togglePlayPause = () => {
    wavesurferRef.current?.playPause();
  };

  const handleReset = () => {
    wavesurferRef.current?.stop();
    setCurrentPlaybackTimeMs(0);
  };

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
      </div>

      <div className="relative z-10 w-full bg-[#0a0c12] rounded-xl p-3 border border-[#1a1d2d] mt-auto shrink-0">
         <div ref={waveformRef} className="w-full mb-2" />
         
         <div className="flex justify-center items-center gap-4">
            <button 
                onClick={handleReset}
                className="p-2 rounded-full hover:bg-surface text-primary/60 hover:text-primary transition-colors hover:rotate-[-45deg] duration-300"
            >
                <RotateCcw size={18} />
            </button>
            <button 
                onClick={togglePlayPause}
                className="w-12 h-12 rounded-full bg-primary text-void flex items-center justify-center hover:scale-105 hover:shadow-[0_0_25px_rgba(224,230,237,0.4)] transition-all pl-1"
                style={{ paddingLeft: isPlaying ? '0' : '3px' }}
            >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
         </div>
      </div>

    </motion.div>
  );
};
