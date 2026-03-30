"use client";

import React from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export const LiveAnalyzer = () => {
  const { analysisResult } = useStore();

  if (!analysisResult) {
    return (
      <div className="w-full h-full min-h-[150px] border border-[#2a2d3d] border-dashed rounded-xl flex items-center justify-center bg-[#0a0c12] opacity-50 flex-1">
        <p className="font-mono text-primary/40 uppercase tracking-widest text-xs text-center">
           Awaiting sequence...<br/>
           Input a verse to begin.
        </p>
      </div>
    );
  }

  const { syllables, chanda_valid, chanda_violations, lg_string, chanda, ganas } = analysisResult;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02
      }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    show: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <div className="w-full flex flex-col justify-start items-center h-full min-h-0 bg-transparent flex-1">
        <div className="w-full flex flex-col gap-4">
            
            <div className="flex justify-between items-start">
            <h3 className="font-mono text-primary/60 uppercase tracking-widest text-sm flex items-center gap-2">
                <span>{'[+]'}</span> Prosodic Structure
            </h3>
            <div className={`flex items-center gap-2 text-xs font-mono tracking-wider ${chanda_valid ? 'text-laghu' : 'text-warning'}`}>
                {chanda_valid ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                {chanda_valid ? `Valid ${chanda.toUpperCase()}` : 'Chanda Violation'}
            </div>
            </div>

            <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-wrap gap-2 items-end mt-2"
            >
            {syllables.map((syllable, i) => {
                const isGuru = syllable.weight === 'G';
                return (
                <motion.div 
                    key={`${syllable.position}-${i}`}
                    variants={item}
                    className={`relative group flex flex-col items-center gap-1 transition-all duration-300 hover:-translate-y-1`}
                    style={{ flexBasis: isGuru ? '40px' : '22px', flexGrow: 0, flexShrink: 0 }}
                >
                    <div className="text-center font-devanagari text-base text-primary">
                    {syllable.text}
                    </div>
                    {/* The Block */}
                    <div className={`h-6 w-full rounded-md shadow-lg ${isGuru ? 'bg-guru shadow-[0_0_15px_rgba(242,169,0,0.3)]' : 'bg-laghu shadow-[0_0_15px_rgba(69,162,158,0.3)]'}`} />
                    <div className="text-[9px] font-mono font-bold text-primary/60">
                    {syllable.weight}
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a1d2d] text-primary whitespace-nowrap px-3 py-1.5 rounded text-xs font-mono border border-[#3a3d52] shadow-xl z-10 pointer-events-none">
                    {syllable.reason}
                    </div>
                </motion.div>
                );
            })}
            </motion.div>

            {/* Gana Analysis Section */}
            {ganas && ganas.length > 0 && (
                <div className="w-full mt-2 border-t border-[#2a2d3d] pt-3">
                    <h4 className="font-mono text-primary/50 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span>{'[+]'}</span> Gana groupings
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {ganas.map((gana: any, i: number) => (
                            <div key={i} className="flex flex-col bg-[#0a0c12] border border-[#2a2d3d] rounded-lg p-2 gap-1 items-center hover:border-primary/50 transition-colors">
                                <div className="text-xs font-devanagari text-primary/80">
                                    {gana.syllables.join('·')}
                                </div>
                                <div className="text-[10px] font-mono text-primary" style={{ letterSpacing: '0.1em' }}>
                                    {gana.pattern}
                                </div>
                                <div className="text-[9px] uppercase tracking-wider text-laghu font-bold bg-laghu/10 px-2 py-0.5 rounded">
                                    {gana.gana_name} GANA
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <AnimatePresence>
            {!chanda_valid && chanda_violations.length > 0 && (
                <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-4 rounded-lg bg-warning/10 border border-warning/30 text-warning font-mono text-sm"
                >
                <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-wider">
                    <AlertTriangle size={16} /> Violations Detected
                </div>
                <ul className="list-disc list-inside pl-6 space-y-1">
                    {chanda_violations.map((v, i) => (
                    <li key={i}>{v}</li>
                    ))}
                </ul>
                </motion.div>
            )}
            </AnimatePresence>

        </div>
    </div>
  );
};
