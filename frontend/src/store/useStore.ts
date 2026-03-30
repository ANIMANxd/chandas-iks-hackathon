import { create } from 'zustand';

export interface SyllableOut {
  position: number;
  text: string;
  weight: string;
  reason: string;
}

export interface PlannedOut {
  position: number;
  text: string;
  weight: string;
  duration_ms: number;
  pitch_hz: number;
  pitch_label: string;
}

export interface AnalyzeResponse {
  verse_iast: string;
  chanda: string;
  chanda_type: string;
  chanda_variant: string | null;
  syllable_count: number;
  lg_string: string;
  ganas: any[];
  syllables: SyllableOut[];
  chanda_valid: boolean;
  chanda_score: number;
  chanda_violations: string[];
  chanda_detection?: any[];
  annotation: string;
}

export interface ReciteResponse {
  request_id: string;
  verse_iast: string;
  chanda: string;
  chanda_type: string;
  chanda_variant: string | null;
  melodic_mode: string;
  syllable_count: number;
  lg_string: string;
  ganas: any[];
  syllables: SyllableOut[];
  planned: PlannedOut[];
  chanda_valid: boolean;
  chanda_score: number;
  chanda_violations: string[];
  stt_transcript: string | null;
  stt_accuracy: number | null;
  total_duration_ms: number;
  audio_url: string;
  raw_audio_url: string | null;
  visualization_url: string | null;
  annotation: string;
  timing_table: string;
  processing_time_ms: number;
}

interface AppState {
  verse: string;
  setVerse: (verse: string) => void;
  settings: {
    chanda: string;
    melodic_mode: string;
    base_pitch_hz: number;
  };
  setSettings: (settings: Partial<AppState['settings']>) => void;
  analysisResult: AnalyzeResponse | null;
  setAnalysisResult: (result: AnalyzeResponse | null) => void;
  synthesisResult: ReciteResponse | null;
  setSynthesisResult: (result: ReciteResponse | null) => void;
  isSynthesizing: boolean;
  setIsSynthesizing: (isSynthesizing: boolean) => void;
  currentPlaybackTimeMs: number;
  setCurrentPlaybackTimeMs: (time: number) => void;
}

export const useStore = create<AppState>((set) => ({
  verse: '',
  setVerse: (verse) => set({ verse }),
  settings: {
    chanda: 'anushtubh',
    melodic_mode: 'vedic',
    base_pitch_hz: 200,
  },
  setSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
  analysisResult: null,
  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  synthesisResult: null,
  setSynthesisResult: (synthesisResult) => set({ synthesisResult }),
  isSynthesizing: false,
  setIsSynthesizing: (isSynthesizing) => set({ isSynthesizing }),
  currentPlaybackTimeMs: 0,
  setCurrentPlaybackTimeMs: (currentPlaybackTimeMs) => set({ currentPlaybackTimeMs }),
}));
