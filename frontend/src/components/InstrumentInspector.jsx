import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter
} from "recharts";
import {
  X,
  Radio,
  BatteryCharging,
  Layers,
  MapPin,
  Calendar,
  CheckCircle2,
  TrendingDown,
  Download,
  Activity,
  Maximize2
} from "lucide-react";

export default function InstrumentInspector({ instrument, onClose }) {
  const [activeTab, setActiveTab] = useState("temp"); // temp | salinity | soundspeed | ts_diagram

  if (!instrument) return null;

  // Realistic oceanographic profile data comparing In-situ observation vs INCOIS-ROMS Model
  const profileData = instrument.profileData || [
    { depth: 0, obsTemp: 29.1, modelTemp: 28.9, obsSal: 34.8, modelSal: 34.7, soundSpeed: 1542 },
    { depth: 25, obsTemp: 28.7, modelTemp: 28.5, obsSal: 35.0, modelSal: 34.9, soundSpeed: 1541 },
    { depth: 50, obsTemp: 26.3, modelTemp: 26.0, obsSal: 35.3, modelSal: 35.2, soundSpeed: 1536 },
    { depth: 100, obsTemp: 21.4, modelTemp: 20.8, obsSal: 35.5, modelSal: 35.4, soundSpeed: 1526 },
    { depth: 150, obsTemp: 16.9, modelTemp: 16.5, obsSal: 35.2, modelSal: 35.1, soundSpeed: 1515 },
    { depth: 250, obsTemp: 13.5, modelTemp: 13.1, obsSal: 35.0, modelSal: 34.9, soundSpeed: 1506 },
    { depth: 500, obsTemp: 10.2, modelTemp: 10.0, obsSal: 34.8, modelSal: 34.8, soundSpeed: 1498 },
    { depth: 750, obsTemp: 7.6, modelTemp: 7.8, obsSal: 34.7, modelSal: 34.7, soundSpeed: 1493 },
    { depth: 1000, obsTemp: 5.8, modelTemp: 6.0, obsSal: 34.6, modelSal: 34.6, soundSpeed: 1491 },
    { depth: 1500, obsTemp: 3.9, modelTemp: 4.1, obsSal: 34.5, modelSal: 34.6, soundSpeed: 1494 },
    { depth: 2000, obsTemp: 2.7, modelTemp: 2.8, obsSal: 34.5, modelSal: 34.5, soundSpeed: 1501 },
  ];

  // Water Mass T-S points
  const tsData = profileData.map((d) => ({
    salinity: d.obsSal,
    temperature: d.obsTemp,
    depth: d.depth,
  }));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-[#0B1726] border border-[#1E3A5F] shadow-2xl rounded-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E2D42] bg-[#0E1F33]">
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full animate-ping ${
                instrument.type === "BGC"
                  ? "bg-[#FB7185]"
                  : instrument.type === "Glider"
                  ? "bg-[#38BDF8]"
                  : "bg-[#34D399]"
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#E2EDF8] tracking-wide">
                  {instrument.name || "Argo Float #2902695"}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#172E47] text-[#38BDF8] border border-[#234B73]">
                  {instrument.type || "Core Argo"}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#064E3B]/60 text-[#34D399] border border-[#059669]/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Operational
                </span>
              </div>
              <p className="text-xs text-[#7C98B3] flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#38BDF8]" />
                  {instrument.lat || "14.28° N"}, {instrument.lon || "68.42° E"} (Central Arabian Sea)
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#7C98B3]" />
                  Cycle #{instrument.cycle || 142} • 14 hrs ago
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7C98B3] hover:text-white hover:bg-[#1E334D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b border-[#16273D] bg-[#081320]">
          <div className="p-2.5 rounded-lg bg-[#0C1A2B] border border-[#1B324D]">
            <p className="text-[11px] text-[#7C98B3] uppercase tracking-wider">Max Depth Sampled</p>
            <p className="text-base font-bold text-[#38BDF8] font-mono mt-0.5">2,000 m</p>
            <p className="text-[10px] text-[#557593]">CTD Seabird SBE-41CP</p>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0C1A2B] border border-[#1B324D]">
            <p className="text-[11px] text-[#7C98B3] uppercase tracking-wider">Surface Temp / SST</p>
            <p className="text-base font-bold text-[#F59E0B] font-mono mt-0.5">29.1 °C</p>
            <p className="text-[10px] text-[#34D399]">Within normal climatology</p>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0C1A2B] border border-[#1B324D]">
            <p className="text-[11px] text-[#7C98B3] uppercase tracking-wider">Model Bias (ΔT)</p>
            <p className="text-base font-bold text-[#34D399] font-mono mt-0.5">+0.18 °C</p>
            <p className="text-[10px] text-[#7C98B3]">RMSE: 0.24 °C (R²=0.99)</p>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0C1A2B] border border-[#1B324D]">
            <p className="text-[11px] text-[#7C98B3] uppercase tracking-wider">Sensor Payload</p>
            <p className="text-xs font-semibold text-[#E2EDF8] mt-0.5 truncate">CTD + DO + Chl-a</p>
            <p className="text-[10px] text-[#38BDF8] flex items-center gap-1">
              <BatteryCharging className="w-3 h-3 text-[#34D399]" /> 87% Battery
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between px-4 pt-3 border-b border-[#16273D] bg-[#091522]">
          <div className="flex gap-2">
            {[
              { id: "temp", label: "Temperature (°C)", desc: "Observed vs INCOIS ROMS" },
              { id: "salinity", label: "Salinity (PSU)", desc: "Halocline structure" },
              { id: "soundspeed", label: "Sound Velocity (m/s)", desc: "Sonar / SAR propagation" },
              { id: "ts_diagram", label: "T-S Water Mass", desc: "Density & water mass" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-all border-t-2 ${
                  activeTab === tab.id
                    ? "bg-[#0E1F33] text-[#38BDF8] border-[#38BDF8]"
                    : "text-[#7C98B3] border-transparent hover:text-[#D8E6F3] hover:bg-[#0D1B2D]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-[#7C98B3] pb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#38BDF8] inline-block" /> In-Situ Float
            </span>
            <span className="flex items-center gap-1.5 ml-2">
              <span className="w-3 h-0.5 bg-[#F59E0B] inline-block border-dashed border-t" /> INCOIS ROMS Model
            </span>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="p-4 flex-1 overflow-y-auto bg-[#091422]">
          {activeTab === "temp" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#8DA6BE]">
                  Depth Profile: <strong className="text-white">Temperature (°C) vs Depth (meters)</strong>
                </span>
                <span className="text-[11px] text-[#34D399] font-mono bg-[#0B251E] px-2 py-0.5 rounded border border-[#065F46]">
                  Mixed Layer Depth (MLD): ~42 m
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={profileData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid stroke="#192A3D" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="obsTemp"
                    stroke="#647E99"
                    domain={[0, 32]}
                    tick={{ fontSize: 11, fill: "#8DA6BE" }}
                    label={{
                      value: "Temperature (°C)",
                      position: "insideBottom",
                      offset: -12,
                      fill: "#8DA6BE",
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    dataKey="depth"
                    reversed
                    stroke="#647E99"
                    domain={[0, 2000]}
                    tick={{ fontSize: 11, fill: "#8DA6BE" }}
                    label={{
                      value: "Depth (m)",
                      angle: -90,
                      position: "insideLeft",
                      offset: 5,
                      fill: "#8DA6BE",
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#081320",
                      border: "1px solid #1E3A5F",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#E2EDF8",
                    }}
                    formatter={(val, name) => [
                      `${val} °C`,
                      name === "obsTemp" ? "Float Observation" : "INCOIS ROMS Model",
                    ]}
                    labelFormatter={(label) => `Obs Temp: ${label}°C`}
                  />
                  <Line
                    type="monotone"
                    dataKey="obsTemp"
                    stroke="#38BDF8"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#38BDF8" }}
                    name="Float Observation"
                  />
                  <Line
                    type="monotone"
                    dataKey="modelTemp"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 2, fill: "#F59E0B" }}
                    name="INCOIS ROMS Model"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === "salinity" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#8DA6BE]">
                  Depth Profile: <strong className="text-white">Practical Salinity (PSU) vs Depth</strong>
                </span>
                <span className="text-[11px] text-[#38BDF8] font-mono bg-[#0D2137] px-2 py-0.5 rounded border border-[#1E4369]">
                  Surface Salinity: 34.8 PSU
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={profileData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid stroke="#192A3D" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="obsSal"
                    stroke="#647E99"
                    domain={[34.0, 36.0]}
                    tick={{ fontSize: 11, fill: "#8DA6BE" }}
                    label={{
                      value: "Salinity (PSU)",
                      position: "insideBottom",
                      offset: -12,
                      fill: "#8DA6BE",
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    dataKey="depth"
                    reversed
                    stroke="#647E99"
                    domain={[0, 2000]}
                    tick={{ fontSize: 11, fill: "#8DA6BE" }}
                    label={{
                      value: "Depth (m)",
                      angle: -90,
                      position: "insideLeft",
                      offset: 5,
                      fill: "#8DA6BE",
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#081320",
                      border: "1px solid #1E3A5F",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#E2EDF8",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="obsSal"
                    stroke="#34D399"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#34D399" }}
                    name="Observed Salinity"
                  />
                  <Line
                    type="monotone"
                    dataKey="modelSal"
                    stroke="#FBBF24"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 2, fill: "#FBBF24" }}
                    name="Model Salinity"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === "soundspeed" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#8DA6BE]">
                  Acoustic Profile: <strong className="text-white">Sound Speed (m/s) (SOFAR Channel)</strong>
                </span>
                <span className="text-[11px] text-[#C084FC] font-mono bg-[#231238] px-2 py-0.5 rounded border border-[#4C1D95]">
                  SOFAR Channel Axis: ~1,000 m (1,491 m/s)
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={profileData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid stroke="#192A3D" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="soundSpeed"
                    stroke="#647E99"
                    domain={[1480, 1560]}
                    tick={{ fontSize: 11, fill: "#8DA6BE" }}
                    label={{
                      value: "Speed of Sound (m/s)",
                      position: "insideBottom",
                      offset: -12,
                      fill: "#8DA6BE",
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    dataKey="depth"
                    reversed
                    stroke="#647E99"
                    domain={[0, 2000]}
                    tick={{ fontSize: 11, fill: "#8DA6BE" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#081320",
                      border: "1px solid #1E3A5F",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#E2EDF8",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="soundSpeed"
                    stroke="#A855F7"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#A855F7" }}
                    name="Sound Speed (m/s)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === "ts_diagram" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#8DA6BE]">
                  Water Mass Analysis: <strong className="text-white">Temperature vs Salinity (T-S Diagram)</strong>
                </span>
                <span className="text-[11px] text-[#F97316] font-mono bg-[#2A1508] px-2 py-0.5 rounded border border-[#7C2D12]">
                  Arabian Sea High Salinity Water (ASHSW)
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid stroke="#192A3D" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="salinity"
                    name="Salinity"
                    domain={[34.2, 35.8]}
                    stroke="#647E99"
                    tick={{ fontSize: 11, fill: "#8DA6BE" }}
                    label={{
                      value: "Salinity (PSU)",
                      position: "insideBottom",
                      offset: -12,
                      fill: "#8DA6BE",
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="temperature"
                    name="Temperature"
                    domain={[0, 30]}
                    stroke="#647E99"
                    tick={{ fontSize: 11, fill: "#8DA6BE" }}
                    label={{
                      value: "Potential Temp (°C)",
                      angle: -90,
                      position: "insideLeft",
                      offset: 5,
                      fill: "#8DA6BE",
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{
                      background: "#081320",
                      border: "1px solid #1E3A5F",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#E2EDF8",
                    }}
                  />
                  <Scatter name="Water Mass Profile" data={tsData} fill="#FB923C" line={{ stroke: "#EA580C" }} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-[#1E2D42] bg-[#0A1625] flex items-center justify-between text-xs text-[#7C98B3]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[#38BDF8]">INCOIS-DAAC Open Data</span>
            <span>•</span>
            <span>WMO CF-1.6 Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert("Exporting profile NetCDF (CF-1.6 compliant)...")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#132A42] hover:bg-[#1A3859] text-[#7FDDF0] border border-[#234F77] transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export NetCDF / CSV
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-[#1A2838] hover:bg-[#25394F] text-[#DCE8F0] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
