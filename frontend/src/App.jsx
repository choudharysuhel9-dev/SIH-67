import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Thermometer, Droplets, Waves, X, Loader2 } from "lucide-react";

// Dummy profile data for the click-a-float chart
const profileData = [
  { depth: 0, temp: 28.2, salinity: 34.9 },
  { depth: 50, temp: 24.1, salinity: 35.1 },
  { depth: 100, temp: 18.6, salinity: 35.3 },
  { depth: 200, temp: 13.2, salinity: 35.0 },
  { depth: 400, temp: 9.8, salinity: 34.8 },
  { depth: 800, temp: 5.4, salinity: 34.6 },
  { depth: 1500, temp: 3.1, salinity: 34.5 },
];

const VARIABLES = [
  { id: "temp", label: "Temperature", icon: Thermometer, unit: "°C" },
  { id: "salinity", label: "Salinity", icon: Droplets, unit: "PSU" },
  { id: "currents", label: "Currents", icon: Waves, unit: "m/s" },
];

export default function OceanDashboard() {
  const [variable, setVariable] = useState("temp");
  const [depth, setDepth] = useState(50);
  const [timeStep, setTimeStep] = useState(3);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeVar = VARIABLES.find((v) => v.id === variable);

  function handleFloatClick() {
    setLoading(true);
    setShowProfile(true);
    // simulate a fetch delay so loading state is visible
    setTimeout(() => setLoading(false), 900);
  }

  return (
    <div className="w-full h-full min-h-[640px] bg-[#0A1420] text-[#DCE8F0] flex flex-col font-sans">
      {/* Navbar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-[#1B2A3A] bg-[#0C1826]">
        <div className="flex items-center gap-2.5">
          <Waves className="w-5 h-5 text-[#4FC3D9]" />
          <span className="font-semibold tracking-tight text-[15px]">INCOIS Ocean Visualizer</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-[#7C93A8]">
          <span className="hidden sm:inline">Indian Ocean · Arabian Sea · Bay of Bengal</span>
          <span className="w-2 h-2 rounded-full bg-[#4ADE80] inline-block" />
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar controls */}
        <aside className="w-64 shrink-0 border-r border-[#1B2A3A] bg-[#0C1826] p-4 flex flex-col gap-6 overflow-y-auto">
          <div>
            <p className="text-xs text-[#7C93A8] mb-2">Variable</p>
            <div className="flex flex-col gap-1.5">
              {VARIABLES.map((v) => {
                const Icon = v.icon;
                const active = v.id === variable;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVariable(v.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                      active
                        ? "bg-[#173247] text-[#7FDDF0] border border-[#2C5A73]"
                        : "text-[#B8C9D6] border border-transparent hover:bg-[#12233350]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-2">
              <p className="text-xs text-[#7C93A8]">Depth</p>
              <span className="text-sm text-[#DCE8F0]">{depth} m</span>
            </div>
            <input
              type="range"
              min={0}
              max={1500}
              step={10}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="w-full accent-[#4FC3D9]"
            />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-2">
              <p className="text-xs text-[#7C93A8]">Time step</p>
              <span className="text-sm text-[#DCE8F0]">Day {timeStep}</span>
            </div>
            <input
              type="range"
              min={0}
              max={7}
              step={1}
              value={timeStep}
              onChange={(e) => setTimeStep(Number(e.target.value))}
              className="w-full accent-[#4FC3D9]"
            />
          </div>

          <div>
            <p className="text-xs text-[#7C93A8] mb-2">Vertical exaggeration</p>
            <input type="range" min={1} max={10} defaultValue={3} className="w-full accent-[#4FC3D9]" />
          </div>

          <button
            onClick={handleFloatClick}
            className="mt-auto text-sm px-3 py-2 rounded-md bg-[#173247] hover:bg-[#1E3F58] text-[#7FDDF0] border border-[#2C5A73] transition-colors"
          >
            Simulate float click →
          </button>
        </aside>

        {/* Main viewport */}
        <main className="flex-1 relative bg-[radial-gradient(circle_at_50%_40%,#0F2438,#060D16)]">
          <div className="absolute inset-0 flex items-center justify-center text-[#3D5A70] text-sm">
            3D globe / viewport renders here (Three.js or Cesium.js)
          </div>

          {/* dummy float markers */}
          <button
            onClick={handleFloatClick}
            className="absolute top-[35%] left-[45%] w-3 h-3 rounded-full bg-[#4ADE80] shadow-[0_0_10px_#4ADE80] hover:scale-125 transition-transform"
            title="Float 2900123 — click for profile"
          />
          <button
            onClick={handleFloatClick}
            className="absolute top-[55%] left-[60%] w-3 h-3 rounded-full bg-[#FBBF24] shadow-[0_0_10px_#FBBF24] hover:scale-125 transition-transform"
            title="Float 2900456 — click for profile"
          />

          {/* Colorbar / legend */}
          <div className="absolute bottom-5 left-5 bg-[#0C1826EE] border border-[#1B2A3A] rounded-md px-3 py-2.5 w-56">
            <div className="flex justify-between text-[11px] text-[#7C93A8] mb-1.5">
              <span>{activeVar.label}</span>
              <span>{activeVar.unit}</span>
            </div>
            <div className="h-2.5 rounded-full bg-gradient-to-r from-[#1E3A8A] via-[#22D3EE] to-[#F97316]" />
            <div className="flex justify-between text-[10px] text-[#5A7488] mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </main>
      </div>

      {/* Profile panel (opens on float click) */}
      {showProfile && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10" onClick={() => setShowProfile(false)}>
          <div
            className="bg-[#0C1826] border border-[#1B2A3A] rounded-lg w-[420px] max-w-[90%] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-medium">Float 2900123 — Profile</p>
              <button onClick={() => setShowProfile(false)} className="text-[#7C93A8] hover:text-[#DCE8F0]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="h-52 flex items-center justify-center text-[#7C93A8] gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading ocean data…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={profileData}>
                  <CartesianGrid stroke="#1B2A3A" />
                  <XAxis dataKey="depth" stroke="#7C93A8" tick={{ fontSize: 11 }} label={{ value: "Depth (m)", position: "insideBottom", offset: -5, fill: "#7C93A8", fontSize: 11 }} />
                  <YAxis stroke="#7C93A8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#0C1826", border: "1px solid #1B2A3A", fontSize: 12 }} />
                  <Line type="monotone" dataKey="temp" stroke="#F97316" strokeWidth={2} dot={{ r: 2 }} name="Temp °C" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
