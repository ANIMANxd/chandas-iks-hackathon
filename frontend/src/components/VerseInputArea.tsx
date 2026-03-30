"use client";

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { RefreshCcw, ChevronDown } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useDebounce } from 'use-debounce';

export const VerseInputArea = () => {
  const { verse, setVerse, settings, setAnalysisResult, setIsSynthesizing } = useStore();
  const [debouncedVerse] = useDebounce(verse, 500);
  const [versesList, setVersesList] = useState<{name: string; verse: string}[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchVerses = async () => {
      try {
        const response = await apiClient.get('/verses');
        setVersesList(response.data);
      } catch (error) {
        console.error('Failed to fetch verses', error);
      }
    };
    fetchVerses();
  }, []);

  useEffect(() => {
    const analyzeVerse = async () => {
      if (!debouncedVerse.trim()) {
        setAnalysisResult(null);
        return;
      }
      try {
        const response = await apiClient.post('/analyze', {
          verse: debouncedVerse,
          chanda: settings.chanda,
        });
        setAnalysisResult(response.data);
      } catch (error) {
        console.error('Analysis failed', error);
        setAnalysisResult(null);
      }
    };
    analyzeVerse();
  }, [debouncedVerse, settings.chanda, setAnalysisResult]);

  const handleSelectVerse = (v: string) => {
    setVerse(v);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full h-full rounded-2xl bg-surface border border-[#2a2d3d] p-6 shadow-2xl flex flex-col gap-4 backdrop-blur-md">
      <div className="flex justify-between items-center relative shrink-0">
        <h2 className="text-xl font-mono text-primary font-bold tracking-wider uppercase opacity-80 flex items-center gap-2">
          <span>{'>_'}</span> Input Matrix
        </h2>
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-sm bg-[#1a1d2d] hover:bg-[#252839] transition-colors border border-[#3a3d52] px-4 py-2 rounded flex items-center gap-2 text-primary"
          >
            Load Example <ChevronDown size={14}/>
          </button>
          {showDropdown && versesList.length > 0 && (
            <div className="absolute right-0 top-12 w-64 bg-[#11131A] border border-[#2a2d3d] shadow-2xl rounded-md z-50 overflow-hidden">
              {versesList.map((v, idx) => (
                <div 
                  key={idx} 
                  className="px-4 py-3 hover:bg-[#1f2233] cursor-pointer transition-colors border-b border-[#1f2233] last:border-b-0"
                  onClick={() => handleSelectVerse(v.verse)}
                >
                  <p className="text-xs text-primary opacity-60 mb-1">{v.name}</p>
                  <p className="font-devanagari text-sm truncate">{v.verse}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <textarea 
        value={verse}
        onChange={(e) => setVerse(e.target.value)}
        placeholder="Enter Devanāgarī or IAST here..."
        className="flex-1 w-full bg-transparent resize-none outline-none border-none text-2xl md:text-3xl font-devanagari text-primary focus:ring-0 leading-snug placeholder-primary/20 scrollbar-hide py-2"
        spellCheck="false"
      />

      <div className="absolute bottom-4 right-6">
        <button 
          onClick={() => setVerse('')} 
          className="text-primary/40 hover:text-warning transition-colors"
          title="Clear Input"
        >
          <RefreshCcw size={18} />
        </button>
      </div>
    </div>
  );
};
