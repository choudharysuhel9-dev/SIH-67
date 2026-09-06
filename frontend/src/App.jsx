import ColorbarEditor from './components/ColorbarEditor';
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Thermometer, Droplets, Waves, X, Loader2, AlertTriangle } from "lucide-react";


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
  const [error, setError] = useState(false);
  const [showGlobeMobile, setShowGlobeMobile] = useState(false);

  const activeVar = VARIABLES.find((v) => v.id === variable);

  
  function handleFloatClick() {
    setLoading(true);
    setError(false);
    setShowProfile(true);
    // simulate a fetch delay; randomly fails ~30% of the time so you can demo the error state too
    setTimeout(() => {
      setLoading(false);
      if (Math.random() < 0.3) setError(true);
    }, 900);
  }

  function handleRetry() {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      setLoading(false);
      // retry always succeeds for the demo
    }, 700);
  }


  return (
    <div className="w-full  h-screen bg-[#0A1420] text-[#DCE8F0] flex flex-col font-sans">
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

     <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Sidebar controls */}
       <aside className={`${showGlobeMobile ? "hidden" : "flex"} lg:flex w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-[#1B2A3A] bg-[#0C1826] p-5 lg:p-4 flex-col gap-6 overflow-y-auto`}>
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
          <button onClick={() => setShowGlobeMobile(true)} className="lg:hidden text-sm px-3 py-2 rounded-md bg-[#1E3F58] hover:bg-[#26507A] text-white border border-[#2C5A73] transition-colors" > Open 3D viewport → </button>
        </aside>

        {/* Main viewport */}
      <main className={ showGlobeMobile ? "fixed inset-0 z-30 bg-[radial-gradient(circle_at_50%_40%,#0F2438,#060D16)] lg:static lg:z-auto lg:flex-1 lg:relative" : "hidden lg:flex lg:flex-1 lg:relative bg-[radial-gradient(circle_at_50%_40%,#0F2438,#060D16)]" } >
         <button onClick={() => setShowGlobeMobile(false)} className="lg:hidden absolute top-3 left-3 z-20 text-xs px-2.5 py-1.5 rounded-md bg-[#0C1826EE] border border-[#1B2A3A] text-[#DCE8F0]" > ← Back to controls </button>
          <div className="absolute inset-0 flex items-center justify-center text-[#3D5A70] text-sm pointer-events-none">
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

              {/* Float status legend */} 
              <div className="absolute top-3 right-3 bg-[#0C1826EE] border border-[#1B2A3A] rounded-md px-3 py-2.5"> <p className="text-[11px] text-[#7C93A8] mb-1.5">Float Status</p>
               <div className="flex flex-col gap-1"> <div className="flex items-center gap-2"> <span className="w-2 h-2 rounded-full bg-[#4ADE80]" /> <span className="text-[11px] text-[#DCE8F0]">Active</span> </div> 
               <div className="flex items-center gap-2"> <span className="w-2 h-2 rounded-full bg-[#FBBF24]" /> 
               <span className="text-[11px] text-[#DCE8F0]">Recent Data</span> </div>
                <div className="flex items-center gap-2"> <span className="w-2 h-2 rounded-full bg-[#F87171]" /> 
                <span className="text-[11px] text-[#DCE8F0]">BGC Sensor</span> </div> 
                </div> 
                </div>
          {/* Colorbar / legend */}
         <ColorbarEditor variableLabel={activeVar.label} unit={activeVar.unit} />
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
            ) : error ? (
  <div className="h-52 flex flex-col items-center justify-center gap-3 text-sm text-center px-4">
    <AlertTriangle className="w-5 h-5 text-[#F87171]" />
    <p className="text-[#F87171]">Failed to load profile data</p>
    <p className="text-[#7C93A8] text-xs">The float may be offline or the connection timed out.</p>
    <button
      onClick={handleRetry}
      className="text-sm px-3 py-1.5 rounded-md bg-[#173247] hover:bg-[#1E3F58] text-[#7FDDF0] border border-[#2C5A73] transition-colors"
    >
      Retry
    </button>
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
