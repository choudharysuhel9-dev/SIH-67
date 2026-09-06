import { useState } from "react";

const PALETTES = {
  Ocean: "from-[#1E3A8A] via-[#22D3EE] to-[#F97316]",
  Thermal: "from-[#0EA5E9] via-[#FACC15] to-[#DC2626]",
  Viridis: "from-[#440154] via-[#21918C] to-[#FDE725]",
};

export default function ColorbarEditor({ variableLabel = "Temperature", unit = "°C" }) {
  const [palette, setPalette] = useState("Ocean");
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(30);

  return (
    <div className="bg-[#0C1826EE] border border-[#1B2A3A] rounded-md px-3 py-2.5 w-56">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] text-[#7C93A8]">{variableLabel}</span>
        <select
          value={palette}
          onChange={(e) => setPalette(e.target.value)}
          className="bg-[#12233350] text-[11px] text-[#DCE8F0] border border-[#1B2A3A] rounded px-1.5 py-0.5"
        >
          {Object.keys(PALETTES).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className={`h-2.5 rounded-full bg-gradient-to-r ${PALETTES[palette]}`} />

      <div className="flex justify-between items-center gap-2 mt-2">
        <input
          type="number"
          value={min}
          onChange={(e) => setMin(Number(e.target.value))}
          className="w-14 bg-[#12233350] text-[11px] text-[#DCE8F0] border border-[#1B2A3A] rounded px-1 py-0.5"
        />
        <span className="text-[10px] text-[#5A7488]">{unit}</span>
        <input
          type="number"
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
          className="w-14 bg-[#12233350] text-[11px] text-[#DCE8F0] border border-[#1B2A3A] rounded px-1 py-0.5 text-right"
        />
      </div>
    </div>
  );
}
