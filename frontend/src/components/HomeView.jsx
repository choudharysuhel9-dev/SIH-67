import React from "react";
import {
  Globe2,
  ArrowRight,
  Shield,
  Layers,
  Activity,
  Waves,
  LifeBuoy,
  Flame,
  Fish,
  Radio,
  BarChart3,
  Compass
} from "lucide-react";

export default function HomeView({ onNavigate, onSelectMission }) {
  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-[#02050B] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,_#091D36_0%,_#030812_65%,_#000000_100%)] text-[#DCE8F0] p-4 sm:p-6 lg:p-10 space-y-8 select-none">
      {/* =========================================================================
          EXECUTIVE HERO SECTION (Dark Obsidian & Deep Abyss Blue)
          ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden border border-[#132A44] bg-gradient-to-b from-[#061324]/90 to-[#020710]/95 p-6 sm:p-10 lg:p-12 shadow-2xl backdrop-blur-md">
        {/* Subtle luminous deep blue ambient flare */}
        <div className="absolute -top-24 right-1/4 w-96 h-96 bg-[#0284C7]/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-5">
          {/* Official Government & INCOIS Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#051424] border border-[#163657] text-xs font-mono text-[#38BDF8] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
            <span className="font-semibold">Ministry of Earth Sciences (MoES) • Govt. of India</span>
            <span className="text-[#5D81A2] hidden sm:inline">| INCOIS SIH-67</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            National 3D Ocean Intelligence &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#60A5FA] to-[#34D399]">
              Operational Forecaster System
            </span>
          </h1>

          {/* Subtitle / Objective */}
          <p className="text-sm sm:text-base text-[#92B1CD] leading-relaxed max-w-3xl">
            A unified browser-native platform co-visualizing 3D numerical ocean model simulations (ROMS / HYCOM)
            with real-time in-situ observations from autonomous Argo floats, underwater gliders, and moored buoys
            across India's 2.37 million km² Exclusive Economic Zone (EEZ).
          </p>

          {/* Single Primary Action Button */}
          <div className="pt-2 flex items-center gap-4">
            <button
              onClick={() => onNavigate("visualizer")}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#0284C7] text-white font-bold text-sm shadow-[0_0_30px_rgba(2,132,199,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Globe2 className="w-5 h-5 text-white" />
              <span>Enter 3D Ocean Visualizer</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          KEY OPERATIONAL METRICS (High-Contrast Obsidian Cards)
          ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: "Surveillance Area",
            value: "2.37M km²",
            sub: "Full Indian EEZ boundary",
            color: "text-[#38BDF8]",
          },
          {
            label: "Volumetric Depth",
            value: "0 – 2,000 m",
            sub: "Surface to bathypelagic abyss",
            color: "text-[#F59E0B]",
          },
          {
            label: "Active In-Situ Beacons",
            value: "5 Platforms",
            sub: "Argo, Gliders & Moored Buoys",
            color: "text-[#34D399]",
          },
          {
            label: "Model Validation",
            value: "R² = 0.988",
            sub: "RMSE 0.24°C | Bias +0.18°C",
            color: "text-[#A855F7]",
          },
        ].map((metric, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-[#040C17]/90 border border-[#12273D] backdrop-blur-sm space-y-1"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#688CAE]">
              {metric.label}
            </span>
            <div className={`text-xl sm:text-2xl font-black font-mono ${metric.color}`}>
              {metric.value}
            </div>
            <p className="text-[11px] text-[#7896B2]">{metric.sub}</p>
          </div>
        ))}
      </div>

      {/* =========================================================================
          THE 3 CORE ARCHITECTURAL PILLARS (Informative, Clean, No Duplicate Links)
          ========================================================================= */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Core System Pillars
          </h2>
          <p className="text-xs text-[#7392AD]">
            How numerical modeling and in-situ ocean observation unite on a single platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1: Numerical Modeling */}
          <div className="rounded-2xl bg-[#040C17]/80 border border-[#12283E] p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#0284C7]/20 text-[#38BDF8] border border-[#0284C7]/30">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">3D Numerical Modeling</h3>
                <span className="text-[10px] font-mono text-[#38BDF8]">ROMS & HYCOM Outputs</span>
              </div>
            </div>
            <p className="text-xs text-[#8BA7BF] leading-relaxed">
              Provides multi-depth volumetric fields of Sea Surface Temperature (SST), Salinity,
              Current Streamlines, and Sea Surface Height with interactive time-step playback and
              custom scientific color palettes.
            </p>
          </div>

          {/* Pillar 2: In-Situ Ground Truth */}
          <div className="rounded-2xl bg-[#040C17]/80 border border-[#12283E] p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">In-Situ Ground Truth</h3>
                <span className="text-[10px] font-mono text-[#34D399]">Argo & Glider Telemetry</span>
              </div>
            </div>
            <p className="text-xs text-[#8BA7BF] leading-relaxed">
              Autonomous robotic sensors provide real physical profiles. The system plots real observations
              alongside numerical forecasts to calculate statistical bias, ensuring ocean forecasts remain accurate.
            </p>
          </div>

          {/* Pillar 3: Operational Mandates */}
          <div className="rounded-2xl bg-[#040C17]/80 border border-[#12283E] p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Maritime Emergency Roles</h3>
                <span className="text-[10px] font-mono text-[#EF4444]">Disaster & Advisory Presets</span>
              </div>
            </div>
            <p className="text-xs text-[#8BA7BF] leading-relaxed">
              Tailored presets for time-bound missions: Cyclone Hazard (Upper Ocean Heat / TCHP),
              Indian Coast Guard Search & Rescue (surface drift vectors), and Potential Fishing Zones (PFZ).
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          QUICK MISSION LAUNCHER BAR (Instant 1-Click Entry to Specific Mission)
          ========================================================================= */}
      <div className="rounded-2xl bg-[#030913] border border-[#112438] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#688CAE] block">
            Direct Mission Launch
          </span>
          <p className="text-xs text-[#A1BCD4]">
            Jump straight into the 3D globe pre-configured for an operational disaster role:
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (onSelectMission) onSelectMission("cyclone");
              onNavigate("visualizer");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/40 text-xs font-semibold transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span>Cyclone Hazard</span>
          </button>

          <button
            onClick={() => {
              if (onSelectMission) onSelectMission("sar");
              onNavigate("visualizer");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
            <span>Coast Guard SAR</span>
          </button>

          <button
            onClick={() => {
              if (onSelectMission) onSelectMission("fishery");
              onNavigate("visualizer");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors"
          >
            <Fish className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fishery PFZ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
