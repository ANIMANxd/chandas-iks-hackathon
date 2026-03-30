const fs = require('fs');

const pageContent = `import { VerseInputArea } from "@/components/VerseInputArea";
import { EngineSettings } from "@/components/EngineSettings";
import { ActionCenter } from "@/components/ActionCenter";
import { LiveAnalyzer } from "@/components/LiveAnalyzer";
import { ProsodyPlaybackDeck } from "@/components/ProsodyPlaybackDeck";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-void">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-laghu/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-guru/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none mix-blend-overlay" />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        
        <header className="mb-12 border-b border-[#2a2d3d] pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl md:text-5xl font-mono font-bold tracking-tighter text-primary mb-2 flex items-center gap-4">
              CHANDA<span className="text-guru">_</span>OS 
              <span className="text-xs uppercase tracking-widest bg-primary/10 px-3 py-1 rounded text-primary/60 border border-primary/20">v1.2 // POC</span>
            </h1>
            <p className="text-primary/50 font-mono tracking-wider ml-1">Constrained Sanskrit Recitation Engine</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 flex flex-col gap-6">
            <VerseInputArea />
            <EngineSettings />
            <ActionCenter />
          </div>

          <div className="lg:col-span-8 flex flex-col gap-6">
            <LiveAnalyzer />
            <ProsodyPlaybackDeck />
          </div>

        </div>

      </div>
    </main>
  );
}
`;

fs.writeFileSync('src/app/page.tsx', pageContent, 'utf8');

const globalsCss = `@import "tailwindcss";

@theme {
  --color-void: #05050A;
  --color-surface: #11131A;
  --color-laghu: #45A29E;
  --color-guru: #F2A900;
  --color-warning: #E94560;
  --color-primary: #E0E6ED;

  --font-sans: "Inter", "Manrope", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --font-devanagari: "Noto Sans Devanagari", "Tiro Devanagari Sanskrit", serif;
}

@layer base {
  body {
    background-color: var(--color-void);
    color: var(--color-primary);
    font-family: var(--font-sans);
  }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: var(--color-void);
}
::-webkit-scrollbar-thumb {
  background: var(--color-surface);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #2a2d3d;
}
`;

fs.writeFileSync('src/app/globals.css', globalsCss, 'utf8');
