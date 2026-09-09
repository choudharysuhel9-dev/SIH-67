import { useState, useRef, useEffect } from "react";
import {
  Compass,
  Layers,
  Crosshair,
  Radio,
  Eye,
  Info,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  Clock,
  Maximize2,
  Minimize2,
  Sparkles
} from "lucide-react";

// Real Indian Ocean In-situ Observation Platforms
export const INSTRUMENTS = [
  {
    id: "argo_2902695",
    name: "Argo Float #2902695",
    type: "Core Argo",
    lat: "14.28° N",
    lon: "68.42° E",
    region: "Central Arabian Sea",
    status: "active",
    xPct: 36,
    yPct: 44,
    cycle: 142,
    sst: 28.9,
    salinity: 35.3,
    maxDepth: "2000 m",
  },
  {
    id: "argo_2903102",
    name: "Argo Float #2903102",
    type: "BGC Sensor",
    lat: "12.80° N",
    lon: "87.50° E",
    region: "Bay of Bengal Basin",
    status: "bgc",
    xPct: 68,
    yPct: 52,
    cycle: 89,
    sst: 29.4,
    salinity: 33.1,
    maxDepth: "2000 m",
  },
  {
    id: "glider_sg621",
    name: "Underwater Glider SG-621",
    type: "Glider",
    lat: "09.55° N",
    lon: "74.80° E",
    region: "Malabar Upwelling Transect",
    status: "glider",
    xPct: 46,
    yPct: 62,
    cycle: 310,
    sst: 27.2,
    salinity: 34.9,
    maxDepth: "1000 m",
  },
  {
    id: "omni_bd09",
    name: "OMNI Moored Buoy BD09",
    type: "Mooring",
    lat: "17.50° N",
    lon: "89.20° E",
    region: "Northern Bay of Bengal",
    status: "recent",
    xPct: 73,
    yPct: 35,
    cycle: "Continuous",
    sst: 28.6,
    salinity: 32.8,
    maxDepth: "Surface + ADCP",
  },
  {
    id: "argo_2901844",
    name: "Argo Float #2901844",
    type: "Core Argo",
    lat: "04.10° N",
    lon: "78.20° E",
    region: "Equatorial Jet Corridor",
    status: "active",
    xPct: 52,
    yPct: 76,
    cycle: 204,
    sst: 29.7,
    salinity: 34.6,
    maxDepth: "2000 m",
  },
];

export default function ViewportStage({
  variable = "temp",
  depth = 50,
  timeStep = 3,
  layers = {},
  verticalExaggeration = 5,
  layerOpacity = 85,
  onSelectInstrument,
  colorbarComponent,
  timelineComponent,
}) {
  const [hoveredPlatform, setHoveredPlatform] = useState(null);
  const [cursorCoords, setCursorCoords] = useState({ lat: "14.28° N", lon: "68.42° E" });
  const [showLegendMobile, setShowLegendMobile] = useState(false);
  const [mobileActiveBottomTab, setMobileActiveBottomTab] = useState("timeline"); // timeline | colorbar | hide
  const [isSpaceTheatreMode, setIsSpaceTheatreMode] = useState(false);
  const containerRef = useRef(null);

  // Expose real-time parameters for teammate's Cesium/Three.js canvas
  useEffect(() => {
    window.ocean3dSettings = {
      verticalExaggeration,
      layerOpacity,
      depth,
      variable,
      timeStep,
    };
  }, [verticalExaggeration, layerOpacity, depth, variable, timeStep]);

  // Press ESC to exit Space Mode
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setIsSpaceTheatreMode(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Mouse coordinate calculation across Indian Ocean viewport
  function handleMouseMove(e) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;

    const lon = (50 + xRatio * 50).toFixed(2);
    const lat = (28 - yRatio * 38).toFixed(2);
    setCursorCoords({
      lat: `${Math.abs(lat)}° ${lat >= 0 ? "N" : "S"}`,
      lon: `${lon}° E`,
    });
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={
        isSpaceTheatreMode
          ? "fixed inset-0 z-50 w-screen h-screen overflow-hidden select-none bg-black bg-[radial-gradient(ellipse_at_center,_#040914_0%,_#000000_100%)] flex flex-col justify-between animate-in fade-in duration-300"
          : "relative flex-1 w-full h-full overflow-hidden select-none bg-[radial-gradient(ellipse_at_top,_#0E263D_0%,_#071321_60%,_#040A12_100%)] flex flex-col justify-between"
      }
    >
      {/* Cosmos Stars Background in Space Mode */}
      {isSpaceTheatreMode && (
        <div className="absolute inset-0 pointer-events-none opacity-60">
          <div className="absolute top-[10%] left-[15%] w-1 h-1 bg-white rounded-full animate-pulse" />
          <div className="absolute top-[25%] left-[80%] w-1.5 h-1.5 bg-blue-200 rounded-full animate-ping opacity-40" />
          <div className="absolute top-[70%] left-[20%] w-1 h-1 bg-white rounded-full opacity-60" />
          <div className="absolute top-[45%] left-[90%] w-1 h-1 bg-cyan-200 rounded-full animate-pulse" />
          <div className="absolute top-[85%] left-[75%] w-1.5 h-1.5 bg-white rounded-full opacity-50" />
          <div className="absolute top-[15%] left-[60%] w-0.5 h-0.5 bg-white rounded-full opacity-70" />
        </div>
      )}
      {/* =========================================================================
          DROP-IN MOUNT POINT FOR 3D TEAMMATE (Three.js / Cesium.js Canvas)
          ========================================================================= */}
      <div id="three-viewport-mount" className="absolute inset-0 pointer-events-auto">
        {/* Synthetic Bathymetry Grid & Coastline Projection */}
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#152C441A_1px,transparent_1px),linear-gradient(to_bottom,#152C441A_1px,transparent_1px)] bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem]" />

        {/* Indian Coastline & EEZ Boundary SVG */}
        <svg
          viewBox="0 0 1000 700"
          className="w-full h-full object-cover opacity-60 pointer-events-none"
        >
          <defs>
            <radialGradient id="oceanGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0077B6" stopOpacity="0.0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width="1000" height="700" fill="url(#oceanGlow)" />

          {/* Indian Subcontinent */}
          <path
            d="M 330,120 L 370,160 L 410,210 L 440,240 L 460,280 L 490,340 L 510,400 L 525,440 L 530,480 L 510,500 L 490,460 L 460,420 L 430,370 L 400,340 L 380,310 L 340,290 L 320,260 Z"
            fill="#091E33"
            stroke="#26507A"
            strokeWidth="1.5"
            opacity="0.85"
          />

          {/* Sri Lanka */}
          <path
            d="M 535,510 C 545,515 545,535 538,540 C 530,535 528,520 535,510 Z"
            fill="#091E33"
            stroke="#26507A"
            strokeWidth="1.5"
          />

          {/* Andaman & Nicobar */}
          <path
            d="M 770,380 L 773,420 L 776,460 L 780,510"
            stroke="#38BDF8"
            strokeWidth="2"
            strokeDasharray="3 4"
            opacity="0.7"
          />

          {/* 200nm EEZ Boundary */}
          {layers.eez !== false && (
            <path
              d="M 280,240 Q 320,330 400,430 Q 480,550 530,580 Q 580,550 630,470 Q 720,390 820,340"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              opacity="0.75"
              filter="url(#glow)"
            />
          )}

          {/* Bathymetric Ridges */}
          {layers.bathymetry !== false && (
            <g stroke="#1A3859" strokeWidth="1" strokeDasharray="2 3" opacity="0.6">
              <path d="M 750,220 L 740,650" />
              <path d="M 260,350 L 380,520" />
              <path d="M 440,540 L 460,670" />
            </g>
          )}

          {/* Simulated Currents */}
          {layers.currents !== false && (
            <g stroke="#22D3EE" strokeWidth="1.2" opacity="0.45">
              <path d="M 250,560 Q 330,460 410,400 Q 470,370 510,440" strokeDasharray="5 7" />
              <path d="M 270,580 Q 350,480 430,420 Q 490,390 530,460" strokeDasharray="5 7" />
              <path d="M 570,470 Q 660,380 730,410 Q 750,490 670,530 Z" strokeDasharray="4 6" />
            </g>
          )}
        </svg>
      </div>

      {/* =========================================================================
          TOP HUD OVERLAYS (Adaptive for Mobile & Desktop + Space Mode Enlarge)
          ========================================================================= */}
      <div className="relative z-10 flex items-start justify-between p-2.5 sm:p-4 pointer-events-none gap-2">
        {/* Region & Telemetry Info (Responsive Compact) */}
        <div className="bg-[#091524]/90 backdrop-blur-md border border-[#1B3552] rounded-xl p-2 sm:p-3 pointer-events-auto shadow-lg max-w-[240px] sm:max-w-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse shrink-0" />
            <span className="text-[11px] sm:text-xs font-semibold text-white truncate">
              Indian Ocean Basin
            </span>
            <span className="hidden xs:inline text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-[#13283E] text-[#38BDF8] font-mono">
              EEZ Active
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 text-[9px] sm:text-[10px] font-mono text-[#7C98B3] border-t border-[#162C44] pt-1">
            <span className="truncate">Slice: <strong className="text-[#F59E0B]">{depth}m</strong></span>
            <span>•</span>
            <span className="text-[#34D399] font-medium">{verticalExaggeration}x</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-[#38BDF8]">{cursorCoords.lat}, {cursorCoords.lon}</span>
          </div>
        </div>

        {/* Center Space Mode Indicator Banner (when enlarged) */}
        {isSpaceTheatreMode && (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-[#38BDF8]/40 shadow-[0_0_20px_rgba(56,189,248,0.3)] text-xs text-white pointer-events-auto animate-in fade-in zoom-in-95">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8] animate-pulse" />
            <span className="font-semibold text-[#38BDF8]">Space Orbit Theatre View</span>
            <span className="text-[#7C98B3] text-[11px]">• Press ESC to exit</span>
          </div>
        )}

        {/* Top Right: Space Mode Toggle & Float Status Legend */}
        <div className="pointer-events-auto flex items-start gap-2">
          {/* Space Mode Enlarge / Shrink Toggle Button */}
          <button
            onClick={() => setIsSpaceTheatreMode(!isSpaceTheatreMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs shadow-xl transition-all ${
              isSpaceTheatreMode
                ? "bg-[#091524]/90 border-[#F59E0B] text-[#F59E0B] hover:bg-[#152336]"
                : "bg-[#091524]/90 border-[#1B3552] hover:border-[#38BDF8] text-white hover:bg-[#122538]"
            }`}
            title={isSpaceTheatreMode ? "Exit Space Mode (ESC)" : "Enlarge 3D Globe to Deep Space View"}
          >
            {isSpaceTheatreMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="hidden sm:inline">Exit Space View</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="hidden sm:inline">Enlarge Globe (Space Mode)</span>
              </>
            )}
          </button>

          {/* Float Status Legend (Collapsible on Mobile) */}
          <div className="flex flex-col items-end">
            <button
              onClick={() => setShowLegendMobile(!showLegendMobile)}
              className="sm:hidden flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#091524]/90 border border-[#1B3552] text-[10px] text-[#7C98B3] hover:text-white shadow-md"
            >
              <Info className="w-3 h-3 text-[#38BDF8]" />
              <span>Legend</span>
              {showLegendMobile ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

          {/* Desktop Legend & Mobile Expanded View */}
          <div
            className={`${
              showLegendMobile ? "flex mt-1.5" : "hidden"
            } sm:flex flex-col bg-[#091524]/90 backdrop-blur-md border border-[#1B3552] rounded-xl p-2.5 sm:p-3 shadow-lg text-[10px] sm:text-[11px] animate-in fade-in duration-150`}
          >
            <p className="text-[9px] sm:text-[10px] text-[#7C98B3] uppercase tracking-wider mb-1.5 font-medium">
              In-Situ Platforms ({INSTRUMENTS.length})
            </p>
            <div className="flex flex-col gap-1 sm:gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
                <span className="text-[#DCE8F0]">Active Argo Float</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185]" />
                <span className="text-[#DCE8F0]">BGC-Argo (Bio/O₂)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
                <span className="text-[#DCE8F0]">Underwater Glider</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FBBF24] shadow-[0_0_8px_#FBBF24]" />
                <span className="text-[#DCE8F0]">OMNI Moored Buoy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* =========================================================================
          INTERACTIVE IN-SITU BEACON PINS (Large Finger-Friendly Hit Targets)
          ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none">
        {INSTRUMENTS.map((inst) => {
          const isHovered = hoveredPlatform?.id === inst.id;
          const colorClass =
            inst.status === "bgc"
              ? "bg-[#FB7185] shadow-[0_0_12px_#FB7185]"
              : inst.status === "glider"
              ? "bg-[#38BDF8] shadow-[0_0_12px_#38BDF8]"
              : inst.status === "recent"
              ? "bg-[#FBBF24] shadow-[0_0_12px_#FBBF24]"
              : "bg-[#34D399] shadow-[0_0_12px_#34D399]";

          return (
            <div
              key={inst.id}
              style={{ top: `${inst.yPct}%`, left: `${inst.xPct}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-20"
            >
              {/* Pulsing Radar Ring */}
              <div
                className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                  inst.status === "bgc" ? "bg-[#FB7185]" : "bg-[#38BDF8]"
                }`}
              />

              {/* Beacon Button (With generous touch padding for mobile fingers) */}
              <button
                onClick={() => onSelectInstrument(inst)}
                onMouseEnter={() => setHoveredPlatform(inst)}
                onMouseLeave={() => setHoveredPlatform(null)}
                className="p-2 -m-2 flex items-center justify-center cursor-pointer group"
                title={`${inst.name} — Tap to inspect`}
              >
                <div
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ${colorClass} group-hover:scale-150 transition-all flex items-center justify-center border-2 border-[#091524]`}
                >
                  <span className="w-1 h-1 bg-white rounded-full opacity-90" />
                </div>
              </button>

              {/* Hover/Tap Tooltip Card */}
              {isHovered && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 sm:w-52 p-2 sm:p-2.5 rounded-xl bg-[#091524]/95 backdrop-blur-md border border-[#1E3E61] shadow-2xl z-30 pointer-events-none animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-[#18314C] pb-1">
                    <span className="text-[11px] sm:text-xs font-semibold text-white truncate">{inst.name}</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-[#132A42] text-[#38BDF8]">
                      {inst.type}
                    </span>
                  </div>
                  <div className="mt-1 space-y-0.5 text-[10px] sm:text-[11px] text-[#8EA7BF]">
                    <div className="flex justify-between">
                      <span>Coordinates:</span>
                      <strong className="text-white font-mono">{inst.lat}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>SST:</span>
                      <strong className="text-[#F59E0B] font-mono">{inst.sst} °C</strong>
                    </div>
                  </div>
                  <div className="mt-1.5 pt-1 border-t border-[#18314C] text-[9px] sm:text-[10px] text-[#38BDF8] text-center font-medium">
                    Tap to inspect vs Model →
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          BOTTOM DOCK (Smart Responsive: Desktop side-by-side, Mobile Tabs)
          ========================================================================= */}
      <div className="relative z-10 p-2 sm:p-4 pointer-events-none flex flex-col gap-2">
        {/* Mobile Dock Switcher Tabs */}
        <div className="sm:hidden flex items-center justify-center gap-1.5 pointer-events-auto">
          <button
            onClick={() =>
              setMobileActiveBottomTab(mobileActiveBottomTab === "timeline" ? "hide" : "timeline")
            }
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border shadow-lg transition-all ${
              mobileActiveBottomTab === "timeline"
                ? "bg-[#0284C7] text-white border-[#38BDF8]"
                : "bg-[#091524]/90 text-[#7C98B3] border-[#1B3552]"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>4D Timeline</span>
          </button>

          <button
            onClick={() =>
              setMobileActiveBottomTab(mobileActiveBottomTab === "colorbar" ? "hide" : "colorbar")
            }
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border shadow-lg transition-all ${
              mobileActiveBottomTab === "colorbar"
                ? "bg-[#0284C7] text-white border-[#38BDF8]"
                : "bg-[#091524]/90 text-[#7C98B3] border-[#1B3552]"
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Colorbar</span>
          </button>
        </div>

        {/* Elements Container: On desktop show both side-by-side; on mobile show active tab */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Colorbar */}
          <div
            className={`pointer-events-auto w-full sm:w-auto ${
              mobileActiveBottomTab === "colorbar" ? "block" : "hidden sm:block"
            }`}
          >
            {colorbarComponent}
          </div>

          {/* 4D Timeline */}
          <div
            className={`pointer-events-auto w-full sm:w-auto flex-1 max-w-2xl ${
              mobileActiveBottomTab === "timeline" ? "block" : "hidden sm:block"
            }`}
          >
            {timelineComponent}
          </div>
        </div>
      </div>
    </div>
  );
}
