import { useState } from "react";
import ViewportStage, { INSTRUMENTS } from "./ViewportStage";
import ColorbarEditor from "./ColorbarEditor";
import TimelinePlayer from "./TimelinePlayer";
import { OCEAN_VARIABLES } from "../App";
import { Sliders, Eye, ChevronLeft, ChevronRight, Layers, X } from "lucide-react";

export default function VisualizerView({
  variable,
  setVariable,
  depth,
  setDepth,
  timeStep,
  setTimeStep,
  layers,
  handleLayerToggle,
  onSelectInstrument,
  activeMission,
  onSelectMission,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [dismissedAlertMission, setDismissedAlertMission] = useState(null);
  const [verticalExaggeration, setVerticalExaggeration] = useState(5);
  const [layerOpacity, setLayerOpacity] = useState(85);

  const isAlertVisible =
    activeMission?.alertInfo && dismissedAlertMission !== activeMission.id;
  const ActiveMissionIcon = activeMission?.icon;

  const activeVar =
    OCEAN_VARIABLES.find((v) => v.id === variable) || OCEAN_VARIABLES[0];

  function getDepthZone(m) {
    if (m <= 200) return { name: "Epipelagic Zone", badge: "Sunlit Layer (0-200m)", color: "text-[#38BDF8]" };
    if (m <= 1000) return { name: "Mesopelagic Zone", badge: "Twilight Thermocline (200-1000m)", color: "text-[#F59E0B]" };
    return { name: "Bathypelagic Zone", badge: "Midnight Abyss (>1000m)", color: "text-[#A855F7]" };
  }

  const depthZone = getDepthZone(depth);

  const controlContent = (
    <>
      {/* Active Mission Header Card in Sidebar */}
      {activeMission && (
        <div
          className="p-2.5 rounded-xl border flex items-center justify-between transition-all"
          style={{
            backgroundColor: `${activeMission.color}12`,
            borderColor: `${activeMission.color}35`,
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="p-1.5 rounded-lg shrink-0"
              style={{
                backgroundColor: `${activeMission.color}25`,
                color: activeMission.color,
              }}
            >
              <ActiveMissionIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold tracking-wider text-[#6E8FA9] block">
                Active Mission
              </span>
              <span className="text-xs font-semibold text-white truncate block">
                {activeMission.shortLabel}
              </span>
            </div>
          </div>
          {activeMission.id !== "standard" && onSelectMission && (
            <button
              onClick={() => onSelectMission("standard")}
              className="text-[10px] text-[#7C98B3] hover:text-white underline font-mono shrink-0 ml-1.5"
              title="Reset to Standard Forecaster mode"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Outreach Mode Hint */}
      {activeMission?.id === "outreach" && (
        <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
          <span className="font-semibold block text-white text-[11px] mb-0.5">🎓 Student Mode</span>
          <p className="text-[10px] text-cyan-300 leading-relaxed">
            Simplified display for students. Click any pulsing beacon on the map to inspect depth and temperature.
          </p>
        </div>
      )}

      {/* Variable Selection */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-[#8EA7BF] uppercase tracking-wider">
            Ocean Variable
          </span>
          <span className="text-[10px] text-[#38BDF8] font-mono">{activeVar.unit}</span>
        </div>
        <div className="space-y-1">
          {OCEAN_VARIABLES.map((v) => {
            const Icon = v.icon;
            const active = v.id === variable;
            return (
              <button
                key={v.id}
                onClick={() => {
                  setVariable(v.id);
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-all ${
                  active
                    ? "bg-[#132B44] text-[#E2EDF8] border border-[#23507D] shadow-[0_0_12px_rgba(2,132,199,0.15)]"
                    : "text-[#8DA6BE] hover:bg-[#0E2033] hover:text-[#DCE8F0] border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="p-1 rounded-lg"
                    style={{
                      backgroundColor: active ? `${v.color}25` : "#122538",
                      color: active ? v.color : "#7C98B3",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">{v.label}</p>
                    <p className="text-[9px] text-[#63829F] mt-0.5">{v.desc}</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono opacity-80 px-1 py-0.2 rounded bg-[#0A1624]">
                  {v.unit}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Depth Slider with Oceanographic Zones */}
      <div className="p-3 rounded-xl bg-[#071321] border border-[#142A42] space-y-2">
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
              className="w-14 bg-[#0E2236] border border-[#1A3757] rounded px-1.5 py-0.5 text-xs text-[#38BDF8] font-mono text-right focus:outline-none"
            />
            <span className="text-xs font-mono text-[#6E8FA9]">m</span>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={2000}
          step={10}
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
          className="w-full accent-[#38BDF8] h-1.5 bg-[#142A42] rounded-lg cursor-pointer"
        />

        <div className="grid grid-cols-4 gap-1 text-[9px] font-mono pt-0.5">
          {[
            { label: "0m", val: 0 },
            { label: "50m", val: 50 },
            { label: "200m", val: 200 },
            { label: "1000m", val: 1000 },
          ].map((p) => (
            <button
              key={p.val}
              onClick={() => setDepth(p.val)}
              className={`py-0.5 rounded border text-center transition-colors ${
                depth === p.val
                  ? "bg-[#16385B] text-[#38BDF8] border-[#255685]"
                  : "bg-[#0A1828] text-[#7C98B3] border-[#132A42] hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Geospatial Layers */}
      <div>
        <span className="text-xs font-semibold text-[#8EA7BF] uppercase tracking-wider block mb-1.5">
          Layers
        </span>
        <div className="space-y-1 text-xs">
          {[
            { key: "eez", label: "Indian EEZ (200nm)" },
            { key: "bathymetry", label: "Bathymetry Ridges" },
            { key: "currents", label: "Current Streamlines" },
            { key: "floats", label: "Argo & Glider Beacons" },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between p-2 rounded-lg bg-[#0E1F33] hover:bg-[#12273F] border border-[#162F4A] cursor-pointer transition-colors"
            >
              <span className="text-[#DCE8F0] font-medium">{item.label}</span>
              <input
                type="checkbox"
                checked={layers[item.key]}
                onChange={() => handleLayerToggle(item.key)}
                className="accent-[#38BDF8] w-3.5 h-3.5 rounded cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>

      {/* 3D Volumetric & Rendering Controls */}
      <div className="p-3 rounded-xl bg-[#071321] border border-[#142A42] space-y-3">
        {/* Vertical Exaggeration Slider (1x - 10x) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8EA7BF] uppercase tracking-wider">
              Vertical Exaggeration
            </span>
            <span className="text-[11px] font-mono text-[#38BDF8] font-bold">
              {verticalExaggeration}x
            </span>
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
          <div className="flex justify-between text-[9px] font-mono text-[#587591]">
            <span>1x (True Scale)</span>
            <span>5x (Standard)</span>
            <span>10x (High Relief)</span>
          </div>
        </div>

        {/* Layer Opacity Slider (20% - 100%) */}
        <div className="space-y-1 pt-2 border-t border-[#12273D]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8EA7BF] uppercase tracking-wider">
              Layer Opacity
            </span>
            <span className="text-[11px] font-mono text-[#34D399] font-bold">
              {layerOpacity}%
            </span>
          </div>
          <input
            type="range"
            min={20}
            max={100}
            step={5}
            value={layerOpacity}
            onChange={(e) => setLayerOpacity(Number(e.target.value))}
            className="w-full accent-[#34D399] h-1.5 bg-[#142A42] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-[#587591]">
            <span>20% (Subtle)</span>
            <span>85% (Optimal)</span>
            <span>100% (Solid)</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex-1 w-full h-full flex relative overflow-hidden">
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-150"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Slide-over Drawer (< lg) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-[#0A1726] border-r border-[#172E47] p-4 flex flex-col gap-4 overflow-y-auto shadow-2xl transition-transform duration-200 lg:hidden ${
          mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#162D45]">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Ocean Controls
          </span>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1 rounded text-[#7C98B3] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {controlContent}
      </aside>

      {/* Desktop Static Sidebar (>= lg) */}
      <aside
        className={`hidden lg:flex ${
          sidebarCollapsed ? "w-12" : "w-72 xl:w-80"
        } shrink-0 border-r border-[#172E47] bg-[#0A1726]/95 backdrop-blur-md p-3 sm:p-4 flex-col gap-4 overflow-y-auto transition-all duration-200 z-20`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#162D45]">
          {!sidebarCollapsed && (
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Visualizer Controls
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-lg text-[#7C98B3] hover:text-white hover:bg-[#132A42] transition-colors ml-auto"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        {!sidebarCollapsed && controlContent}
      </aside>

      {/* Viewport Stage (Takes 100% full width on mobile!) */}
      <main className="flex-1 flex relative overflow-hidden w-full h-full">
        {/* Floating Mobile Controls Button (< lg) */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="lg:hidden absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#091524]/90 backdrop-blur-md border border-[#1B3552] text-xs text-white shadow-xl hover:border-[#38BDF8] transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Controls</span>
        </button>

        {/* Sleek Minimalist Operational Alert Pill */}
        {isAlertVisible && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0A1828]/95 backdrop-blur-md border border-[#1E3A5A] shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-xs text-white max-w-[92vw] animate-in fade-in zoom-in-95 duration-200">
            <span
              className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0 ${activeMission.alertInfo.badgeColor}`}
            >
              {activeMission.alertInfo.badge}
            </span>
            <span className="text-[11px] text-[#DCE8F0] truncate font-medium">
              {activeMission.alertInfo.title}: <strong className="text-[#38BDF8]">{activeMission.alertInfo.metricLabel} {activeMission.alertInfo.metricValue}</strong>
            </span>
            {activeMission.alertInfo.actionLabel && (
              <button
                onClick={() => {
                  const target = INSTRUMENTS.find(
                    (i) => i.id === activeMission.alertInfo.targetInstrumentId
                  );
                  if (target) onSelectInstrument(target);
                }}
                className="hidden sm:flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-white shrink-0 font-medium ml-1 transition-colors"
              >
                <span>{activeMission.alertInfo.actionLabel}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => setDismissedAlertMission(activeMission.id)}
              className="text-[#6E8FA9] hover:text-white p-0.5 rounded transition-colors shrink-0 ml-1"
              title="Dismiss Alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <ViewportStage
          variable={variable}
          depth={depth}
          timeStep={timeStep}
          layers={layers}
          verticalExaggeration={verticalExaggeration}
          layerOpacity={layerOpacity}
          onSelectInstrument={onSelectInstrument}
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
  );
}
