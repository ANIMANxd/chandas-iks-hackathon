"use client";

import React from 'react';
import { useStore } from '@/store/useStore';
import { apiClient } from '@/lib/api';
import { Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ActionCenter = () => {
  const { verse, settings, isSynthesizing, setIsSynthesizing, setSynthesisResult } = useStore();

  const handleSynthesize = async () => {
    if (!verse.trim()) return;
    setIsSynthesizing(true);
    setSynthesisResult(null);

    try {
      const response = await apiClient.post('/recite', {
        verse,
        chanda: settings.chanda,
        melodic_mode: settings.melodic_mode,
        base_pitch_hz: settings.base_pitch_hz
      });
      setSynthesisResult(response.data);
    } catch (error) {
      console.error('Synthesis failed', error);
      // In a real app we'd set an error state here
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="w-full flex justify-center pb-2">
      <button
        onClick={handleSynthesize}
        disabled={isSynthesizing || !verse.trim()}
        className="relative overflow-hidden group w-full py-4 rounded-xl bg-primary text-void font-bold text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(224,230,237,0.3)]"
      >
        <AnimatePresence mode="wait">
          {isSynthesizing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3"
            >
              <Loader2 className="animate-spin" /> 
              <span>Synthesizing...</span>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3"
            >
              <Zap className="group-hover:scale-110 transition-transform" />
              <span>Synthesize & Recite</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Shine effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
      </button>
    </div>
  );
};
