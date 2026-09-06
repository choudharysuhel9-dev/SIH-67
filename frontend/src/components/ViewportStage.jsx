import { useState, useRef } from "react";
import {
  Compass,
  Maximize,
  Layers,
  Crosshair,
  Navigation,
  Globe2,
  Anchor,
  Radio,
  Eye,
  Info
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
  onSelectInstrument,
  colorbarComponent,
  timelineComponent,
}) {
  const [hoveredPlatform, setHoveredPlatform] = useState(null);
  const [cursorCoords, setCursorCoords] = useState({ lat: "12.45° N", lon: "75.20° E" });
  const containerRef = useRef(null);

  // Mouse coordinate calculation across Indian Ocean viewport
  function handleMouseMove(e) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;

    // Approximate mapping: Lon 50°E to 100°E, Lat 30°N to -10°S
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
      className="relative flex-1 w-full h-full overflow-hidden select-none bg-[radial-gradient(ellipse_at_top,_#0E263D_0%,_#071321_60%,_#040A12_100%)] flex flex-col justify-between"
    >
      {/* =========================================================================
          DROP-IN MOUNT POINT FOR 3D TEAMMATE (Three.js / Cesium.js Canvas)
          Your 3D teammate can mount their Three.js <canvas> directly inside this div.
          ========================================================================= */}
      <div id="three-viewport-mount" className="absolute inset-0 pointer-events-auto">
        {/* Synthetic Bathymetry Grid & Coastline Projection */}
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#152C441A_1px,transparent_1px),linear-gradient(to_bottom,#152C441A_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        {/* Indian Coastline & EEZ Boundary Glow */}
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

          {/* Regional water glow */}
          <rect x="0" y="0" width="1000" height="700" fill="url(#oceanGlow)" />

          {/* Stylized Indian Subcontinent & Coastline */}
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

          {/* Andaman & Nicobar Chain */}
          <path
            d="M 770,380 L 773,420 L 776,460 L 780,510"
            stroke="#38BDF8"
            strokeWidth="2"
            strokeDasharray="3 4"
            opacity="0.7"
          />

          {/* 200nm Exclusive Economic Zone (EEZ) Boundary */}
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

          {/* Deep Bathymetric Ridge Lines (Ninety East Ridge, Carlsberg Ridge) */}
          {layers.bathymetry !== false && (
            <g stroke="#1A3859" strokeWidth="1" strokeDasharray="2 3" opacity="0.6">
              <path d="M 750,220 L 740,650" />
              <path d="M 260,350 L 380,520" />
              <path d="M 440,540 L 460,670" />
            </g>
          )}

          {/* Simulated 3D Current Streamlines */}
          {layers.currents !== false && (
            <g stroke="#22D3EE" strokeWidth="1.2" opacity="0.45">
              {/* Somali Jet & WICC */}
              <path d="M 250,560 Q 330,460 410,400 Q 470,370 510,440" strokeDasharray="5 7" />
              <path d="M 270,580 Q 350,480 430,420 Q 490,390 530,460" strokeDasharray="5 7" />
              {/* Bay of Bengal Gyre */}
              <path d="M 570,470 Q 660,380 730,410 Q 750,490 670,530 Z" strokeDasharray="4 6" />
            </g>
          )}
        </svg>
      </div>

      {/* =========================================================================
          TOP HUD OVERLAYS (Geographic labels, camera presets, telemetry status)
          ========================================================================= */}
      <div className="relative z-10 flex items-start justify-between p-4 pointer-events-none">
        {/* Region & Telemetry Info */}
        <div className="bg-[#091524]/85 backdrop-blur-md border border-[#1B3552] rounded-xl p-3 pointer-events-auto shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-wide">
              Indian Ocean Basin
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#13283E] text-[#38BDF8] font-mono">
              EEZ Active
            </span>
          </div>
          <p className="text-[11px] text-[#7C98B3] mt-0.5">
            Arabian Sea • Bay of Bengal • Equatorial Channel
          </p>
          <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-[#587999] border-t border-[#162C44] pt-1.5">
            <span>Cursor: <strong className="text-[#38BDF8]">{cursorCoords.lat}, {cursorCoords.lon}</strong></span>
            <span>Slice Depth: <strong className="text-[#F59E0B]">{depth} m</strong></span>
          </div>
        </div>

        {/* Float Status Legend */}
        <div className="bg-[#091524]/85 backdrop-blur-md border border-[#1B3552] rounded-xl p-3 pointer-events-auto shadow-lg">
          <p className="text-[10px] text-[#7C98B3] uppercase tracking-wider mb-2 font-medium">
            In-Situ Platforms ({INSTRUMENTS.length})
          </p>
          <div className="flex flex-col gap-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
              <span className="text-[#DCE8F0]">Active Argo Float</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185]" />
              <span className="text-[#DCE8F0]">BGC-Argo (Bio/O₂)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
              <span className="text-[#DCE8F0]">Underwater Glider</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24] shadow-[0_0_8px_#FBBF24]" />
              <span className="text-[#DCE8F0]">OMNI Moored Buoy</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE IN-SITU BEACON PINS (Geospatially Positioned)
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
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-20 group"
            >
              {/* Pulsing Radar Ring */}
              <div
                className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                  inst.status === "bgc" ? "bg-[#FB7185]" : "bg-[#38BDF8]"
                }`}
              />

              {/* Beacon Button */}
              <button
                onClick={() => onSelectInstrument(inst)}
                onMouseEnter={() => setHoveredPlatform(inst)}
                onMouseLeave={() => setHoveredPlatform(null)}
                className={`relative w-4 h-4 rounded-full ${colorClass} hover:scale-150 transition-all cursor-pointer flex items-center justify-center border-2 border-[#091524]`}
                title={`${inst.name} — Click to inspect profile`}
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full opacity-90" />
              </button>

              {/* Hover Tooltip Card */}
              {isHovered && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-52 p-2.5 rounded-xl bg-[#091524]/95 backdrop-blur-md border border-[#1E3E61] shadow-2xl z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="flex items-center justify-between border-b border-[#18314C] pb-1.5">
                    <span className="text-xs font-semibold text-white truncate">{inst.name}</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-[#132A42] text-[#38BDF8]">
                      {inst.type}
                    </span>
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-[11px] text-[#8EA7BF]">
                    <div className="flex justify-between">
                      <span>Coordinates:</span>
                      <strong className="text-white font-mono">{inst.lat}, {inst.lon}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>SST:</span>
                      <strong className="text-[#F59E0B] font-mono">{inst.sst} °C</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Salinity:</span>
                      <strong className="text-[#34D399] font-mono">{inst.salinity} PSU</strong>
                    </div>
                  </div>
                  <div className="mt-2 pt-1 border-t border-[#18314C] text-[10px] text-[#38BDF8] text-center font-medium">
                    Click to inspect vs ROMS Model →
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          FLOATING COLORBAR & TIMELINE CONTROLS DOCK
          ========================================================================= */}
      <div className="relative z-10 flex flex-col sm:flex-row items-end sm:items-center justify-between p-4 gap-3 pointer-events-none">
        {/* Floating Colorbar Editor */}
        <div className="pointer-events-auto">
          {colorbarComponent}
        </div>

        {/* Floating 4D Timeline Scrubber */}
        <div className="pointer-events-auto w-full sm:w-auto">
          {timelineComponent}
        </div>
      </div>
    </div>
  );
}
