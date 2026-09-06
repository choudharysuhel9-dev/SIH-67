import { useState } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

export const PALETTES = {
  Ocean: {
    gradient: "from-[#03045E] via-[#00B4D8] to-[#90E0EF]",
    label: "Ocean (Deep to Shallow)",
  },
  Thermal: {
    gradient: "from-[#082F49] via-[#0284C7] via-[#FACC15] to-[#DC2626]",
    label: "Thermal (SST Standard)",
  },
  Turbo: {
    gradient: "from-[#30123B] via-[#28BBEC] via-[#A2FC3C] via-[#FB8022] to-[#7A0403]",
    label: "Turbo (High Contrast)",
  },
  Viridis: {
    gradient: "from-[#440154] via-[#31688E] via-[#35B779] to-[#FDE725]",
    label: "Viridis (Perceptually Uniform)",
  },
  Haline: {
    gradient: "from-[#112233] via-[#2A9D8F] via-[#E9C46A] to-[#F4A261]",
    label: "Haline (Salinity Practical)",
  },
  Plasma: {
    gradient: "from-[#0D0887] via-[#7E03A8] via-[#CC4778] via-[#F89540] to-[#F0F921]",
    label: "Plasma (High Dynamic Range)",
  },
};

export default function ColorbarEditor({
  variableLabel = "Temperature",
  unit = "°C",
  defaultMin = 0,
  defaultMax = 32,
  onPaletteChange,
}) {
  const [palette, setPalette] = useState("Thermal");
  const [min, setMin] = useState(defaultMin);
  const [max, setMax] = useState(defaultMax);
  const [scaleType, setScaleType] = useState("Linear"); // Linear | Logarithmic
  const [isExpanded, setIsExpanded] = useState(false);

  function handleReset() {
    setMin(defaultMin);
    setMax(defaultMax);
  }

  function handlePaletteSelect(p) {
    setPalette(p);
    if (onPaletteChange) onPaletteChange(p);
  }

  return (
    <div className="bg-[#091524]/95 backdrop-blur-md border border-[#1C3652] rounded-xl p-2.5 sm:p-3 shadow-xl w-full sm:w-60 transition-all">
      {/* Header */}
      <div className="flex justify-between items-center mb-1.5 sm:mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
          <span className="text-xs font-semibold text-[#DCE8F0] tracking-wide">
            {variableLabel}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#162A40] text-[#7C98B3] font-mono">
            {unit}
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-[#7C98B3] hover:text-[#38BDF8] rounded transition-colors"
          title="Toggle Colorbar Settings"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Gradient Bar with Ticks */}
      <div className="relative my-1.5">
        <div
          className={`h-2.5 sm:h-3 rounded-md bg-gradient-to-r ${
            PALETTES[palette]?.gradient || PALETTES.Thermal.gradient
          } shadow-inner border border-white/10`}
        />
        <div className="flex justify-between text-[9px] font-mono text-[#6E879E] mt-0.5 px-0.5">
          <span>{min}</span>
          <span>{((min + max) / 2).toFixed(1)}</span>
          <span>{max}</span>
        </div>
      </div>

      {/* Min/Max Controls */}
      <div className="flex justify-between items-center gap-2 mt-1.5">
        <div className="flex items-center gap-1 bg-[#0E2033] border border-[#1A334E] rounded px-1.5 py-0.5">
          <span className="text-[9px] sm:text-[10px] text-[#557593]">Min:</span>
          <input
            type="number"
            value={min}
            onChange={(e) => setMin(Number(e.target.value))}
            className="w-9 sm:w-10 bg-transparent text-[11px] sm:text-xs text-[#E2EDF8] font-mono focus:outline-none"
          />
        </div>

        <button
          onClick={handleReset}
          className="p-1 rounded text-[#557593] hover:text-[#38BDF8] hover:bg-[#122336] transition-colors"
          title="Auto-scale / Reset Range"
        >
          <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>

        <div className="flex items-center gap-1 bg-[#0E2033] border border-[#1A334E] rounded px-1.5 py-0.5">
          <span className="text-[9px] sm:text-[10px] text-[#557593]">Max:</span>
          <input
            type="number"
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            className="w-9 sm:w-10 bg-transparent text-[11px] sm:text-xs text-[#E2EDF8] font-mono text-right focus:outline-none"
          />
        </div>
      </div>

      {/* Expandable options */}
      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-[#192F47] flex flex-col gap-2 animate-in fade-in duration-150">
          <div>
            <span className="text-[9px] sm:text-[10px] text-[#7C98B3] uppercase tracking-wider block mb-1">
              Colormap Palette
            </span>
            <select
              value={palette}
              onChange={(e) => handlePaletteSelect(e.target.value)}
              className="w-full bg-[#0E2033] text-[11px] sm:text-xs text-[#DCE8F0] border border-[#1B324D] rounded px-2 py-1 focus:outline-none focus:border-[#38BDF8]"
            >
              {Object.keys(PALETTES).map((p) => (
                <option key={p} value={p} style={{ backgroundColor: "#091524", color: "#DCE8F0" }}>
                  {PALETTES[p].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[9px] sm:text-[10px] text-[#7C98B3]">Scale Mapping:</span>
            <div className="flex rounded bg-[#0E2033] p-0.5 border border-[#1B324D]">
              {["Linear", "Log"].map((type) => (
                <button
                  key={type}
                  onClick={() => setScaleType(type)}
                  className={`px-2 py-0.5 text-[9px] sm:text-[10px] rounded transition-colors ${
                    scaleType === type
                      ? "bg-[#1A3C5E] text-[#38BDF8] font-medium"
                      : "text-[#6E879E] hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
