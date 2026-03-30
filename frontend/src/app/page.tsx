import { VerseInputArea } from "@/components/VerseInputArea";
import { EngineSettings } from "@/components/EngineSettings";
import { ActionCenter } from "@/components/ActionCenter";
import { LiveAnalyzer } from "@/components/LiveAnalyzer";
import { ProsodyPlaybackDeck } from "@/components/ProsodyPlaybackDeck";

export default function Home() {
  return (
    <main className="h-screen w-screen relative overflow-hidden bg-void flex flex-col p-4 pb-0">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-laghu/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-guru/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none mix-blend-overlay -z-10" />

      {/* Grid container spanning full remaining height */}
      <div className="flex-1 w-full mx-auto relative z-10 flex flex-col min-h-0">
        
        <header className="mb-4 border-b border-[#2a2d3d] pb-4 flex justify-between items-end shrink-0">
          <div>
            <h1 className="text-3xl font-mono font-bold tracking-tighter text-primary mb-1 flex items-center gap-4">
              CHANDA<span className="text-guru">_</span>ENGINE 
              <span className="text-[10px] uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded text-primary/60 border border-primary/20">v1.2 // POC</span>
            </h1>
            <p className="text-primary/50 text-xs font-mono tracking-wider ml-1">Constrained Sanskrit Recitation Engine...</p>
          </div>
        </header>

        {/* Dense CSS Grid Layout */}
        <div className="grid grid-cols-12 grid-rows-[auto_1fr] gap-4 flex-1 min-h-0 pb-4">
          
          {/* Top Left: Input Area */}
          <div className="col-span-8 row-span-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-hidden h-full">
              <VerseInputArea />
            </div>
          </div>

          {/* Right Column: Settings + Action (spans both rows) */}
          <div className="col-span-4 row-span-2 flex flex-col gap-4 min-h-0">
            <div className="flex-1 overflow-y-auto rounded-2xl pr-1">
              <EngineSettings />
            </div>
            <div className="shrink-0">
              <ActionCenter />
            </div>
          </div>

          {/* Bottom Left: Analyzer */}
          <div className="col-span-8 row-span-1 grid grid-cols-5 gap-4 min-h-0">
            <div className="col-span-2 flex flex-col overflow-y-auto bg-surface rounded-2xl border border-[#2a2d3d] backdrop-blur-md p-4 pb-2 shadow-xl custom-scrollbar pr-2">
              <LiveAnalyzer />
            </div>
            {/* Playback gets more horizontal room so the image is wider */}
            <div className="col-span-3 flex flex-col overflow-y-auto bg-surface rounded-2xl border border-[#2a2d3d] backdrop-blur-md p-4 pb-2 shadow-xl custom-scrollbar pr-2">
              <ProsodyPlaybackDeck />
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
