import { useState } from "react";
import {
  Thermometer,
  Droplets,
  Waves,
  Leaf,
  ArrowUpRight,
  Wind,
  Layers,
  GraduationCap,
  Database,
  Sliders,
  Eye,
  Radio,
  Compass,
  CheckCircle2,
  Share2,
  ChevronDown,
  Activity,
  Menu,
  X
} from "lucide-react";

import ColorbarEditor from "./components/ColorbarEditor";
import TimelinePlayer from "./components/TimelinePlayer";
import InstrumentInspector from "./components/InstrumentInspector";
import OutreachStoryModal from "./components/OutreachStoryModal";
import NetCDFIngestModal from "./components/NetCDFIngestModal";
import ViewportStage, { INSTRUMENTS } from "./components/ViewportStage";

// Comprehensive Ocean Variables
export const OCEAN_VARIABLES = [
  {
    id: "temp",
    label: "Temperature (SST)",
    unit: "°C",
    icon: Thermometer,
    defaultMin: 0,
    defaultMax: 32,
    desc: "Thermal structure & MLD",
    color: "#F59E0B",
  },
  {
    id: "salinity",
    label: "Salinity (SSS)",
    unit: "PSU",
    icon: Droplets,
    defaultMin: 32,
    defaultMax: 36.5,
    desc: "Halocline & barrier layer",
    color: "#34D399",
  },
  {
    id: "currents",
    label: "Current Vectors",
    unit: "m/s",
    icon: Waves,
    defaultMin: 0,
    defaultMax: 2.5,
    desc: "3D velocity streamlines",
    color: "#38BDF8",
  },
  {
    id: "chlorophyll",
    label: "Chlorophyll-a",
    unit: "mg/m³",
    icon: Leaf,
    defaultMin: 0.05,
    defaultMax: 10,
    desc: "Primary productivity / PFZ",
    color: "#4ADE80",
  },
  {
    id: "ssh",
    label: "Sea Surface Height",
    unit: "m",
    icon: ArrowUpRight,
    defaultMin: -1.2,
    defaultMax: 1.2,
    desc: "Altimetry & ocean eddies",
    color: "#A855F7",
  },
  {
    id: "oxygen",
    label: "Dissolved Oxygen",
    unit: "μmol/kg",
    icon: Wind,
    defaultMin: 0,
    defaultMax: 250,
    desc: "Oxygen Minimum Zone (OMZ)",
    color: "#FB7185",
  },
];

export default function OceanDashboard() {
  // Primary visualizer state
  const [variable, setVariable] = useState("temp");
  const [depth, setDepth] = useState(50);
  const [timeStep, setTimeStep] = useState(3);
  const [verticalExaggeration, setVerticalExaggeration] = useState(3);

  // Layer visibility toggles
  const [layers, setLayers] = useState({
    eez: true,
    bathymetry: true,
    currents: true,
    floats: true,
  });

  // Modals & Panels
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeVar = OCEAN_VARIABLES.find((v) => v.id === variable) || OCEAN_VARIABLES[0];

  // Oceanographic depth zone label
  function getDepthZoneLabel(m) {
    if (m <= 200) return { name: "Epipelagic Zone (Sunlight Layer)", badge: "Surface / MLD", color: "text-[#38BDF8]" };
    if (m <= 1000) return { name: "Mesopelagic Zone (Twilight Layer)", badge: "Thermocline / OMZ", color: "text-[#F59E0B]" };
    return { name: "Bathypelagic Zone (Midnight Abyss)", badge: "Deep Ocean", color: "text-[#A855F7]" };
  }

  const depthZone = getDepthZoneLabel(depth);

  function handleLayerToggle(key) {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleApplyStorySetting({ depth: newDepth, variable: newVar }) {
    if (newDepth !== undefined) setDepth(newDepth);
    if (newVar !== undefined) setVariable(newVar);
  }

  return (
    <div className="w-full h-screen bg-[#071019] text-[#DCE8F0] flex flex-col font-sans overflow-hidden select-none">
      {/* =========================================================================
          TOP COMMAND NAVBAR
          ========================================================================= */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-[#172E47] bg-[#0A1828]/95 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg bg-[#102336] text-[#7C98B3] hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* INCOIS Branding */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#38BDF8]">
              <Waves className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-sm sm:text-base text-white">
                  INCOIS Ocean 3D Visualizer
                </span>
                <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#0284C7]/20 text-[#38BDF8] border border-[#0284C7]/30">
                  MoES Govt of India
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-[#6E8FA9]">
                Integrated Numerical Ocean Model & In-Situ Observation Platform
              </p>
            </div>
          </div>
        </div>

        {/* Center Live Telemetry & Cycle */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-[#7C98B3] bg-[#071321] px-3.5 py-1.5 rounded-lg border border-[#142A42]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
            <span className="text-[#DCE8F0]">ROMS 0.1° / HYCOM</span>
          </div>
          <span className="text-[#2B4B6E]">•</span>
          <span>Cycle: 00Z Daily</span>
          <span className="text-[#2B4B6E]">•</span>
          <span className="text-[#38BDF8]">EEZ Coverage: 2.37M km²</span>
        </div>

        {/* Right Action Switchers */}
        <div className="flex items-center gap-2">
          {/* Science Outreach / Story Mode Button */}
          <button
            onClick={() => setIsStoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#142D47] hover:bg-[#1A3A5C] text-[#38BDF8] border border-[#224A75] text-xs font-medium transition-all shadow-sm"
            title="Open Science Communication & Guided Stories"
          >
            <GraduationCap className="w-4 h-4 text-[#38BDF8]" />
            <span className="hidden sm:inline">Science Outreach</span>
          </button>

          {/* NetCDF Ingest Button */}
          <button
            onClick={() => setIsIngestModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-medium transition-all shadow-sm"
            title="Import NetCDF (.nc) or In-Situ Data"
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Import NetCDF</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN WORKSPACE LAYOUT (Sidebar Controls + 3D Stage)
          ========================================================================= */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left Sidebar Controls */}
        <aside
          className={`${
            isMobileMenuOpen ? "flex fixed inset-y-0 left-0 z-40 w-80 pt-16" : "hidden"
          } lg:flex lg:static w-80 shrink-0 border-r border-[#172E47] bg-[#0A1726] p-4 flex-col gap-5 overflow-y-auto z-20`}
        >
          {/* Variable Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#8EA7BF] uppercase tracking-wider">
                Ocean State Variable
              </span>
              <span className="text-[10px] text-[#38BDF8] font-mono">
                {activeVar.unit}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {OCEAN_VARIABLES.map((v) => {
                const Icon = v.icon;
                const active = v.id === variable;
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVariable(v.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                      active
                        ? "bg-[#132B44] text-[#E2EDF8] border border-[#23507D] shadow-[0_0_15px_rgba(2,132,199,0.15)]"
                        : "text-[#8DA6BE] hover:bg-[#0E2033] hover:text-[#DCE8F0] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="p-1.5 rounded-lg"
                        style={{
                          backgroundColor: active ? `${v.color}25` : "#122538",
                          color: active ? v.color : "#7C98B3",
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold leading-tight">{v.label}</p>
                        <p className="text-[10px] text-[#63829F] mt-0.5">{v.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono opacity-80 px-1.5 py-0.2 rounded bg-[#0A1624]">
                      {v.unit}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Depth Navigation with Oceanographic Depth Zones */}
          <div className="p-3 rounded-xl bg-[#071321] border border-[#142A42] space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#8EA7BF] uppercase tracking-wider block">
                  Depth Slice
                </span>
                <span className={`text-[10px] font-medium ${depthZone.color}`}>
                  {depthZone.badge}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={2000}
                  step={10}
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  className="w-16 bg-[#0E2236] border border-[#1A3757] rounded px-1.5 py-0.5 text-xs text-[#38BDF8] font-mono text-right focus:outline-none"
                />
                <span className="text-xs font-mono text-[#6E8FA9]">m</span>
              </div>
            </div>

            {/* Range slider */}
            <input
              type="range"
              min={0}
              max={2000}
              step={10}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="w-full accent-[#38BDF8] h-1.5 bg-[#142A42] rounded-lg cursor-pointer"
            />

            {/* Quick depth presets */}
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono pt-1">
              {[
                { label: "0m (SST)", val: 0 },
                { label: "50m (MLD)", val: 50 },
                { label: "200m (Therm)", val: 200 },
                { label: "1000m (Deep)", val: 1000 },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => setDepth(p.val)}
                  className={`py-1 rounded border text-center transition-colors ${
                    depth === p.val
                      ? "bg-[#16385B] text-[#38BDF8] border-[#255685]"
                      : "bg-[#0A1828] text-[#7C98B3] border-[#132A42] hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#557593] italic leading-tight">
              {depthZone.name}
            </p>
          </div>

          {/* Layer & Geospatial Feature Toggles */}
          <div>
            <span className="text-xs font-semibold text-[#8EA7BF] uppercase tracking-wider block mb-2">
              Geospatial Layers
            </span>
            <div className="space-y-1.5">
              {[
                { key: "eez", label: "Indian EEZ (200nm)", desc: "Maritime boundaries" },
                { key: "bathymetry", label: "Bathymetry & Ridges", desc: "Seafloor topography" },
                { key: "currents", label: "Current Streamlines", desc: "Surface & subsurface flow" },
                { key: "floats", label: "Argo & Gliders", desc: "In-situ profiling beacons" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#0E1F33] hover:bg-[#12273F] border border-[#162F4A] cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-xs font-medium text-[#DCE8F0]">{item.label}</p>
                    <p className="text-[10px] text-[#63829F]">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={layers[item.key]}
                    onChange={() => handleLayerToggle(item.key)}
                    className="accent-[#38BDF8] w-4 h-4 rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Vertical Exaggeration Slider */}
          <div className="p-3 rounded-xl bg-[#071321] border border-[#142A42] space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8EA7BF] font-medium">Vertical Exaggeration</span>
              <span className="text-[#38BDF8] font-mono">{verticalExaggeration}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={verticalExaggeration}
              onChange={(e) => setVerticalExaggeration(Number(e.target.value))}
              className="w-full accent-[#38BDF8] h-1.5 bg-[#142A42] rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-[#557593]">
              Enhances shallow continental shelf visibility relative to deep trenches.
            </p>
          </div>

          {/* Simulate Float Click Button */}
          <button
            onClick={() => setSelectedInstrument(INSTRUMENTS[0])}
            className="w-full py-2.5 rounded-xl bg-[#132E4A] hover:bg-[#1A3D63] text-[#7FDDF0] border border-[#22507A] text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Radio className="w-4 h-4 text-[#34D399] animate-pulse" />
            Inspect Float #2902695 vs Model →
          </button>
        </aside>

        {/* Center 3D Viewport Stage */}
        <main className="flex-1 flex relative overflow-hidden">
          <ViewportStage
            variable={variable}
            depth={depth}
            timeStep={timeStep}
            layers={layers}
            onSelectInstrument={(inst) => setSelectedInstrument(inst)}
            colorbarComponent={
              <ColorbarEditor
                variableLabel={activeVar.label}
                unit={activeVar.unit}
                defaultMin={activeVar.defaultMin}
                defaultMax={activeVar.defaultMax}
              />
            }
            timelineComponent={
              <TimelinePlayer
                currentTimeStep={timeStep}
                onChangeTimeStep={setTimeStep}
                maxSteps={7}
              />
            }
          />
        </main>
      </div>

      {/* =========================================================================
          MODALS & OVERLAYS
          ========================================================================= */}
      {/* Instrument Inspector Modal (Co-visualization & Bias Metrics) */}
      <InstrumentInspector
        instrument={selectedInstrument}
        onClose={() => setSelectedInstrument(null)}
      />

      {/* Science Outreach / Guided Story Mode */}
      <OutreachStoryModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        onApplyStorySetting={handleApplyStorySetting}
      />

      {/* NetCDF & Observation Ingestion Pipeline Modal */}
      <NetCDFIngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onDatasetLoaded={(ds) => {
          alert(`Dataset "${ds.name}" successfully loaded into 3D stage!`);
        }}
      />
    </div>
  );
}
