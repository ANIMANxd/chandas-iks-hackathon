"use client";

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { apiClient } from '@/lib/api';

export const EngineSettings = () => {
  const { settings, setSettings } = useStore();
  const [chandas, setChandas] = useState<string[]>(['anushtubh', 'mandakranta']);
  const [modes, setModes] = useState<string[]>(['vedic', 'raga_bhairavi']);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [chandaRes, modeRes] = await Promise.all([
          apiClient.get('/chandas'),
          apiClient.get('/modes')
        ]);
        if (chandaRes.data?.chandas) setChandas(chandaRes.data.chandas.map((c: any) => c.chanda));
        if (modeRes.data?.modes) setModes(modeRes.data.modes.map((m: any) => m.id));
      } catch (error) {
        console.warn('Failed to fetch settings metadata, using defaults', error);
      }
    };
    fetchMetadata();
  }, []);

  return (
    <div className="w-full h-full rounded-2xl bg-surface border border-[#2a2d3d] p-4 shadow-xl flex flex-col gap-4 backdrop-blur-md">
       <h2 className="text-sm font-mono text-primary font-bold tracking-wider uppercase opacity-80 flex items-center gap-2">
          <span>{'⚙'}</span> System Config
        </h2>
        
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-primary/60 font-mono font-bold tracking-widest">Metrical Framework</label>
          <select 
            value={settings.chanda}
            onChange={(e) => setSettings({ chanda: e.target.value })}
            className="w-full bg-[#0a0c12] border border-[#2a2d3d] text-primary p-2 rounded-lg outline-none focus:border-laghu transition-colors appearance-none font-mono text-sm"
          >
            {chandas.map((c: any) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-primary/60 font-mono font-bold tracking-widest">Melodic Mode</label>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
            {modes.map((mode: any) => (
              <button
                key={mode}
                onClick={() => setSettings({ melodic_mode: mode })}
                className={`py-2 px-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all border ${settings.melodic_mode === mode ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(224,230,237,0.1)]' : 'bg-[#0a0c12] border-[#2a2d3d] text-primary/50 hover:bg-[#11131a]'}`}
              >
                {mode.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-auto">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase text-primary/60 font-mono font-bold tracking-widest">Base Pitch (Hz)</label>
            <span className="text-laghu font-mono font-bold text-xs">{settings.base_pitch_hz} Hz</span>
          </div>
          <input 
            type="range" 
            min="80" 
            max="300" 
            step="1"
            value={settings.base_pitch_hz}
            onChange={(e) => setSettings({ base_pitch_hz: Number(e.target.value) })}
            className="w-full accent-laghu"
          />
          <div className="flex justify-between text-[9px] text-primary/40 font-mono uppercase">
            <span>Male (~120Hz)</span>
            <span>Female (~220Hz)</span>
          </div>
        </div>
    </div>
  );
};
