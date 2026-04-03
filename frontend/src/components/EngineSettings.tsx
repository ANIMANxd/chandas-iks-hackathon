"use client";

import React from 'react';
import { useStore } from '@/store/useStore';

export const EngineSettings = () => {
  const { synthesisResult } = useStore();

  const resultData = synthesisResult;

  return (
    <div className="w-full h-full rounded-2xl bg-surface border border-[#2a2d3d] p-4 shadow-xl flex flex-col gap-4 backdrop-blur-md">
      <h2 className="text-sm font-mono text-primary font-bold tracking-wider uppercase opacity-80 flex items-center gap-2">
        <span>{'⊞'}</span> Analysis Dashboard
      </h2>

      <section className="bg-[#161b22] border border-[#2a2d3d] rounded-xl p-3 flex flex-col gap-3 flex-1 min-h-0">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/65 flex items-center gap-2">
          <span className="text-rose-400">{'[!]'}</span> PROSODIC VIOLATIONS
        </h3>

        {!resultData ? (
          <div className="flex-1 rounded-lg border border-[#2a2d3d] bg-[#0d1117] flex items-center justify-center px-3 py-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-primary/40">
              AWAITING SEQUENCE...
            </p>
          </div>
        ) : resultData.chanda_valid ? (
          <div className="flex-1 rounded-xl border border-emerald-900/50 bg-emerald-950/20 flex items-center justify-center px-3 py-4">
            <span className="font-mono text-sm uppercase tracking-[0.16em] text-emerald-400 text-center">
              ZERO VIOLATIONS DETECTED
            </span>
          </div>
        ) : resultData.chanda_violations?.length ? (
          <div className="flex-1 rounded-xl border border-rose-900/50 bg-rose-950/20 p-3 overflow-y-auto custom-scrollbar">
            <ul className="list-disc list-inside space-y-2">
              {resultData.chanda_violations.map((violation, idx) => (
                <li key={idx} className="font-mono text-[11px] leading-relaxed text-rose-300">
                  {violation}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex-1 rounded-lg border border-[#2a2d3d] bg-[#0d1117] flex items-center justify-center px-3 py-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary/45">
              NO VIOLATION PAYLOAD RECEIVED
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
