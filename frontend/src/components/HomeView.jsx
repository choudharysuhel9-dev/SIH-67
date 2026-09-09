import React from "react";
import {
  Globe2,
  ArrowRight,
  Shield,
  Layers,
  Radio,
  Flame,
  LifeBuoy,
  Fish,
  Compass,
  Sparkles
} from "lucide-react";

export default function HomeView({ onNavigate, onLaunchVisualizer, onSelectMission }) {
  const handleLaunch = () => {
    if (onLaunchVisualizer) {
      onLaunchVisualizer();
    } else {
      onNavigate("visualizer");
    }
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-[#020409] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_#0A1D38_0%,_#02060E_60%,_#000000_100%)] text-[#DCE8F0] p-4 sm:p-6 lg:p-10 flex flex-col justify-between select-none">
      {/* =========================================================================
          TOP: MISSION BRIEFING & BRANDING
          ========================================================================= */}
      <div className="max-w-4xl mx-auto text-center space-y-4 pt-2 sm:pt-4">
        {/* Official Ministry Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#061426] border border-[#143354] text-xs font-mono text-[#38BDF8] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
          <span className="font-semibold">Ministry of Earth Sciences (MoES) • Govt. of India</span>
          <span className="text-[#597F9F] hidden sm:inline">| INCOIS SIH-67</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Indian Ocean 3D{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#60A5FA] to-[#34D399]">
            Digital Twin Platform
          </span>
        </h1>

        {/* Minimalist Subtitle */}
        <p className="text-sm sm:text-base text-[#88A8C3] max-w-2xl mx-auto leading-relaxed">
          Co-visualizing 3D numerical ocean forecasts (ROMS/HYCOM) with real-time autonomous
          in-situ sensor telemetry (Argo floats, gliders, and moored buoys) across India's EEZ.
        </p>
      </div>

      {/* =========================================================================
          CENTER: HOLOGRAPHIC OCEAN RADAR & LAUNCH BUTTON
          ========================================================================= */}
      <div className="relative max-w-xl mx-auto my-6 sm:my-8 w-full flex flex-col items-center">
        {/* Radial Ambient Glow behind Radar */}
        <div className="absolute inset-0 bg-[#0284C7]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Simulated Ocean Sonar Scanner Widget */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-[#143455] bg-[#030914]/90 flex items-center justify-center shadow-[0_0_50px_rgba(2,132,199,0.15)] overflow-hidden">
          {/* Concentric Range Rings */}
          <div className="absolute inset-4 rounded-full border border-[#143455]/50" />
          <div className="absolute inset-12 rounded-full border border-[#143455]/40" />
          <div className="absolute inset-20 rounded-full border border-[#143455]/30" />

          {/* Crosshair Axes */}
          <div className="absolute w-full h-[1px] bg-[#143455]/60" />
          <div className="absolute h-full w-[1px] bg-[#143455]/60" />

          {/* Rotating Sonar Radar Sweep Beam */}
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,_transparent_70%,_#38BDF833_100%)] animate-spin pointer-events-none" style={{ animationDuration: '6s' }} />

          {/* Pulsing In-Situ Telemetry Markers */}
          {/* Arabian Sea Float */}
          <div className="absolute top-[38%] left-[32%] flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-ping absolute" />
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] relative shadow-[0_0_8px_#38BDF8]" />
            <span className="text-[9px] font-mono text-[#76A1C4] bg-black/60 px-1 rounded ml-1 hidden sm:inline">Argo #2902695</span>
          </div>

          {/* Bay of Bengal Buoy */}
          <div className="absolute top-[42%] right-[30%] flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-ping absolute" />
            <span className="w-2 h-2 rounded-full bg-[#EF4444] relative shadow-[0_0_8px_#EF4444]" />
            <span className="text-[9px] font-mono text-[#EF4444] bg-black/60 px-1 rounded ml-1 hidden sm:inline">OMNI BD09</span>
          </div>

          {/* Malabar Glider */}
          <div className="absolute bottom-[35%] left-[45%] flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] animate-ping absolute" />
            <span className="w-2 h-2 rounded-full bg-[#34D399] relative shadow-[0_0_8px_#34D399]" />
            <span className="text-[9px] font-mono text-[#34D399] bg-black/60 px-1 rounded ml-1 hidden sm:inline">Glider SG-621</span>
          </div>

          {/* Center Compass Reticle */}
          <div className="z-10 p-2 rounded-full bg-[#061626] border border-[#1D4A75] text-[#38BDF8] shadow-lg">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>

          {/* Bottom Coordinates Overlay */}
          <div className="absolute bottom-2 font-mono text-[9px] text-[#6185A4] bg-black/60 px-2 py-0.5 rounded">
            INDIAN OCEAN EEZ • 0-2000m ACTIVE
          </div>
        </div>

        {/* The Grand Launch Button */}
        <div className="mt-6 sm:mt-8 relative z-20">
          <button
            onClick={handleLaunch}
            className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0284C7] via-[#0369A1] to-[#0284C7] hover:from-[#0369A1] hover:to-[#0284C7] text-white font-extrabold text-sm sm:text-base shadow-[0_0_35px_rgba(2,132,199,0.45)] transition-all hover:scale-[1.03] active:scale-[0.98] border border-[#38BDF8]/40"
          >
            <Globe2 className="w-5 h-5 text-white transition-transform group-hover:rotate-45" />
            <span>Launch 3D Ocean Visualizer</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM: COMPACT TELEMETRY STRIP & QUICK MISSION JUMP
          ========================================================================= */}
      <div className="max-w-4xl mx-auto w-full space-y-3 pt-2">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div className="p-3 rounded-2xl bg-[#040C18]/80 border border-[#11273F]">
            <span className="text-[10px] uppercase font-mono text-[#5A7C9D] block">EEZ Surveillance</span>
            <span className="text-sm sm:text-base font-bold font-mono text-[#38BDF8]">2.37M km²</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#040C18]/80 border border-[#11273F]">
            <span className="text-[10px] uppercase font-mono text-[#5A7C9D] block">Depth Slices</span>
            <span className="text-sm sm:text-base font-bold font-mono text-[#F59E0B]">0 – 2,000 m</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#040C18]/80 border border-[#11273F]">
            <span className="text-[10px] uppercase font-mono text-[#5A7C9D] block">Sensor Validation</span>
            <span className="text-sm sm:text-base font-bold font-mono text-[#34D399]">R² = 0.988</span>
          </div>
        </div>

        {/* Clean 1-Click Operational Presets */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-[11px] text-[#6384A2] font-mono mr-1">Direct Role Launch:</span>
          <button
            onClick={() => {
              if (onSelectMission) onSelectMission("cyclone");
              handleLaunch();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-[11px] font-medium transition-colors"
          >
            <Flame className="w-3 h-3 text-red-400" />
            <span>Cyclone Warning</span>
          </button>
          <button
            onClick={() => {
              if (onSelectMission) onSelectMission("sar");
              handleLaunch();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition-colors"
          >
            <LifeBuoy className="w-3 h-3 text-amber-400" />
            <span>Coast Guard SAR</span>
          </button>
          <button
            onClick={() => {
              if (onSelectMission) onSelectMission("fishery");
              handleLaunch();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-colors"
          >
            <Fish className="w-3 h-3 text-emerald-400" />
            <span>Fishery PFZ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
