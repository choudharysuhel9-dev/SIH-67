import React, { useState, useEffect } from "react";
import { checkBackendHealth } from "./services/oceanApi";
import {
  Thermometer,
  Droplets,
  Waves,
  Leaf,
  ArrowUpRight,
  Wind,
  Globe2,
  BarChart2,
  Bot,
  UploadCloud,
  BookOpen,
  Menu,
  X,
  ChevronDown,
  Home
} from "lucide-react";

import HomeView from "./components/HomeView";
import VisualizerView from "./components/VisualizerView";
import FloatAnalyticsView from "./components/FloatAnalyticsView";
import OceanAIAssistant from "./components/OceanAIAssistant";
import NetCDFUploadView from "./components/NetCDFUploadView";
import GlossaryOutreachView from "./components/GlossaryOutreachView";
import InstrumentInspector from "./components/InstrumentInspector";
import { INSTRUMENTS } from "./components/ViewportStage";
import { MISSION_PROFILES } from "./data/missionProfiles";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("View Render Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 p-6 text-red-400 bg-[#0C1B2E] m-4 rounded-2xl border border-red-500/40 flex flex-col gap-3">
          <h3 className="text-base font-bold text-white">An error occurred while displaying this view:</h3>
          <p className="text-xs text-red-300 font-mono bg-black/40 p-3 rounded-lg border border-red-900/50">
            {this.state.error?.message || String(this.state.error)}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="w-fit text-xs px-3 py-1.5 rounded-lg bg-[#0284C7] text-white hover:bg-[#0369A1]"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

export default function App() {
  // Top Navbar Active Tab: "home" | "visualizer" | "analytics" | "assistant" | "uploads" | "glossary"
  const [activeTab, setActiveTab] = useState("home");

  // Operational Mission Profile State (Disaster / Role presets)
  const [activeMissionId, setActiveMissionId] = useState("cyclone");
  const [isMissionMenuOpen, setIsMissionMenuOpen] = useState(false);

  // Shared visualizer state
  const [variable, setVariable] = useState("temp");
  const [depth, setDepth] = useState(50);
  const [timeStep, setTimeStep] = useState(3);
  const [layers, setLayers] = useState({
    eez: true,
    bathymetry: true,
    currents: true,
    floats: true,
  });

  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function verifyHealth() {
      const res = await checkBackendHealth();
      if (isMounted) {
        setBackendOnline(res.online);
      }
    }
    verifyHealth();
    const interval = setInterval(verifyHealth, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const activeMission =
    MISSION_PROFILES.find((m) => m.id === activeMissionId) || MISSION_PROFILES[0];
  const ActiveMissionIcon = activeMission.icon;

  function handleSelectMission(missionId) {
    const selected = MISSION_PROFILES.find((m) => m.id === missionId);
    if (!selected) return;
    setActiveMissionId(missionId);
    if (selected.preset) {
      setVariable(selected.preset.variable);
      setDepth(selected.preset.depth);
      setLayers(selected.preset.layers);
    }
    setActiveTab("visualizer");
    setIsMissionMenuOpen(false);
  }

  function handleLaunchVisualizer(targetMissionId) {
    if (targetMissionId) {
      const selected = MISSION_PROFILES.find((m) => m.id === targetMissionId);
      if (selected && selected.preset) {
        setActiveMissionId(targetMissionId);
        setVariable(selected.preset.variable);
        setDepth(selected.preset.depth);
        setLayers(selected.preset.layers);
      }
    }
    // Instant, consistent transition into 3D visualizer
    setActiveTab("visualizer");
  }

  function handleLayerToggle(key) {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const NAV_TABS = [
    { id: "home", label: "Home", icon: Home },
    { id: "visualizer", label: "3D Visualizer", icon: Globe2 },
    { id: "analytics", label: "Float Analytics", icon: BarChart2 },
    { id: "assistant", label: "Ocean AI Assistant", icon: Bot },
    { id: "uploads", label: "NetCDF Uploads", icon: UploadCloud },
    { id: "glossary", label: "Glossary & Science", icon: BookOpen },
  ];

  return (
    <div className="w-full h-screen bg-[#071019] text-[#DCE8F0] flex flex-col font-sans overflow-hidden select-none">
      {/* =========================================================================
          CLEAN SPACIOUS NAVBAR (FloatChat Style)
          ========================================================================= */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#172E47] bg-[#0A1828]/95 backdrop-blur-md z-30 shrink-0">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#38BDF8]">
            <Waves className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base sm:text-lg text-white">
                INCOIS Ocean 3D
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0284C7]/20 text-[#38BDF8] border border-[#0284C7]/30 hidden sm:inline">
                MoES Govt of India
              </span>
            </div>
            <p className="text-[10px] text-[#6E8FA9] hidden md:block">
              Integrated Numerical Ocean Model & Observation Platform
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-[#071321] p-1 rounded-2xl border border-[#142A42]">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? "bg-[#0284C7] text-white shadow-md font-semibold"
                    : "text-[#7C98B3] hover:text-white hover:bg-[#0E2034]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Header Right Actions: Mission Profile Selector + Live Status Badge */}
        <div className="flex items-center gap-2.5">
          {/* Operational Mission Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMissionMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm"
              style={{
                backgroundColor: `${activeMission.color}18`,
                borderColor: `${activeMission.color}50`,
                color: activeMission.color,
              }}
              title="Click to switch time-critical operational mission profile"
            >
              <ActiveMissionIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline text-[#8EA7BF] text-[11px] font-normal">Mission:</span>
              <span className="font-semibold text-white truncate max-w-[120px] sm:max-w-none">
                {activeMission.shortLabel}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 opacity-70 transition-transform duration-150 ${
                  isMissionMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Mission Dropdown Menu */}
            {isMissionMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMissionMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-[#0A1828] border border-[#1B3857] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 border-b border-[#142A42] mb-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                        Operational Mission Profiles
                      </span>
                      <span className="text-[9px] text-[#6E8FA9] font-mono">1-Click Presets</span>
                    </div>
                    <p className="text-[10px] text-[#7C98B3] mt-0.5">
                      Auto-configures parameters for time-critical disaster and maritime operations
                    </p>
                  </div>

                  <div className="space-y-1">
                    {MISSION_PROFILES.map((profile) => {
                      const ProfileIcon = profile.icon;
                      const isSelected = profile.id === activeMissionId;
                      return (
                        <button
                          key={profile.id}
                          onClick={() => handleSelectMission(profile.id)}
                          className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all ${
                            isSelected
                              ? "bg-[#132B44] border border-[#23507D]"
                              : "hover:bg-[#0E2034] border border-transparent"
                          }`}
                        >
                          <div
                            className="p-1.5 rounded-lg shrink-0 mt-0.5"
                            style={{
                              backgroundColor: `${profile.color}20`,
                              color: profile.color,
                            }}
                          >
                            <ProfileIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-white">
                                {profile.label}
                              </span>
                              {isSelected && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#0284C7]/30 text-[#38BDF8] font-mono font-bold">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#7C98B3] mt-0.5 line-clamp-2">
                              {profile.description}
                            </p>
                            <span className="inline-block mt-1 text-[9px] font-mono text-[#5A7995]">
                              Target: {profile.targetUser}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div
            className="hidden sm:flex items-center gap-2 text-xs font-mono bg-[#071321] px-3 py-1.5 rounded-xl border border-[#142A42] transition-colors"
            title={backendOnline ? "FastAPI Backend is active at http://localhost:8000" : "FastAPI Backend is standby (Running with local fallback)"}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline
                  ? "bg-[#34D399] animate-pulse shadow-[0_0_8px_#34D399]"
                  : "bg-[#38BDF8]"
              }`}
            />
            <span className={backendOnline ? "text-[#34D399] font-medium" : "text-[#7C98B3]"}>
              {backendOnline ? "FastAPI Live" : "System Ready"}
            </span>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#0E2034] text-[#7C98B3] hover:text-white border border-[#172E47]"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Dropdown */}
      {isMobileNavOpen && (
        <div className="lg:hidden bg-[#0A1828] border-b border-[#172E47] p-3 flex flex-col gap-2 z-40 animate-in fade-in duration-150">
          <div className="flex flex-col gap-1">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileNavOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                    active
                      ? "bg-[#0284C7] text-white font-semibold"
                      : "text-[#7C98B3] hover:bg-[#0E2034] hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Mission Presets Grid */}
          <div className="pt-2 border-t border-[#172E47]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E8FA9] px-1 block mb-1.5">
              Mission Profile Presets
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {MISSION_PROFILES.map((p) => {
                const PIcon = p.icon;
                const isCurrent = p.id === activeMissionId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      handleSelectMission(p.id);
                      setIsMobileNavOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
                      isCurrent
                        ? "bg-[#0284C7] text-white font-semibold"
                        : "bg-[#0E2034] text-[#7C98B3] hover:text-white"
                    }`}
                  >
                    <PIcon className="w-3.5 h-3.5 shrink-0" style={{ color: p.color }} />
                    <span className="truncate">{p.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT VIEWS
          ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        <ErrorBoundary key={activeTab}>
          {activeTab === "home" && (
            <HomeView
              onNavigate={(tab) => setActiveTab(tab)}
              onLaunchVisualizer={handleLaunchVisualizer}
              onSelectMission={handleSelectMission}
            />
          )}

          {activeTab === "visualizer" && (
            <div className="flex-1 w-full h-full flex overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <VisualizerView
                variable={variable}
                setVariable={setVariable}
                depth={depth}
                setDepth={setDepth}
                timeStep={timeStep}
                setTimeStep={setTimeStep}
                layers={layers}
                handleLayerToggle={handleLayerToggle}
                onSelectInstrument={(inst) => setSelectedInstrument(inst)}
                activeMission={activeMission}
                onSelectMission={handleSelectMission}
              />
            </div>
          )}

          {activeTab === "analytics" && <FloatAnalyticsView />}

          {activeTab === "assistant" && <OceanAIAssistant />}

          {activeTab === "uploads" && <NetCDFUploadView />}

          {activeTab === "glossary" && <GlossaryOutreachView />}
        </ErrorBoundary>
      </div>

      {/* Instrument Inspector Modal (Can open when clicking a beacon in 3D view) */}
      <InstrumentInspector
        instrument={selectedInstrument}
        onClose={() => setSelectedInstrument(null)}
      />
    </div>
  );
}
