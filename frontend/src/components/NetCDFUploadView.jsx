import { useState } from "react";
import {
  UploadCloud,
  FileCode,
  CheckCircle2,
  Database,
  FileText,
  Server,
  Layers,
  ArrowRight
} from "lucide-react";

export default function NetCDFUploadView({ onDatasetLoaded }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [ingesting, setIngesting] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  const SAMPLE_DATASETS = [
    {
      id: "roms_daily",
      name: "INCOIS_ROMS_0.1deg_Daily_IndianOcean_2026.nc",
      format: "NetCDF-4 / HDF5",
      size: "148.2 MB",
      variables: ["temp", "salt", "u", "v", "zeta"],
      dims: "time: 168, depth: 40, lat: 320, lon: 450",
      conventions: "CF-1.6, COARDS",
    },
    {
      id: "argo_matrix",
      name: "Indian_Ocean_Argo_Traj_DelayedMode_2026.nc",
      format: "NetCDF-3 64-bit",
      size: "32.6 MB",
      variables: ["PRES", "TEMP_ADJUSTED", "PSAL_ADJUSTED", "DOXY"],
      dims: "N_PROF: 840, N_LEVELS: 120",
      conventions: "Argo User Manual 3.1",
    },
    {
      id: "glider_ascii",
      name: "Slocum_Glider_ArabianSea_Mission4_Transect.csv",
      format: "Delimited ASCII / CSV",
      size: "8.4 MB",
      variables: ["timestamp", "lat", "lon", "depth", "c_temp", "chlorophyll"],
      dims: "rows: 42,500 records",
      conventions: "OceanGliders Trajectory 1.0",
    },
  ];

  function handleUploadSimulation(sample) {
    setIngesting(true);
    setTimeout(() => {
      setIngesting(false);
      setSelectedFile(sample);
      setParsedData({
        title: sample.name,
        format: sample.format,
        dimensions: sample.dims,
        variables: sample.variables,
        conventions: sample.conventions,
        timeSpan: "2026-09-01 to 2026-09-07",
        spatialBounds: "Lat: -20.0° to 30.0° N, Lon: 40.0° to 105.0° E",
        status: "CF-1.6 Metadata Validation: PASSED (0 errors)",
      });
    }, 600);
  }

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 flex flex-col gap-6 overflow-y-auto">
      {/* Title */}
      <div className="bg-[#0C1B2E] border border-[#1C3652] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#38BDF8]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Upload & Analyze Ocean Data
            </h2>
            <p className="text-xs sm:text-sm text-[#7C98B3] mt-0.5">
              Automated ingestion pipeline for NetCDF (`.nc`, `.nc4`), Delimited Text (`.csv`), and OGC OPeNDAP streams.
            </p>
          </div>
        </div>
      </div>

      {/* 2 Clean Cards (Like FloatChat) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: NetCDF File Analysis */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleUploadSimulation(SAMPLE_DATASETS[0]);
          }}
          className={`bg-[#0C1B2E] border rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all ${
            dragOver
              ? "border-[#38BDF8] bg-[#0E2742]/50"
              : "border-[#1C3652] hover:border-[#2C5582]"
          }`}
        >
          <div>
            <div className="p-3 rounded-xl bg-[#142A45] text-[#38BDF8] w-fit mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">NetCDF File Analysis</h3>
            <p className="text-xs text-[#8EA7BF] mt-1 leading-relaxed">
              Upload an ocean model or ARGO `.nc` file to inspect its Climate and Forecast (CF) metadata, extract 3D variables, and visualize layers.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#182E47] flex items-center justify-between">
            <span className="text-xs text-[#6484A3]">Supports NetCDF-3/4, HDF5</span>
            <button
              onClick={() => handleUploadSimulation(SAMPLE_DATASETS[0])}
              className="text-xs px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-medium shadow transition-colors"
            >
              Choose .nc File
            </button>
          </div>
        </div>

        {/* Card 2: Delimited CSV / In-Situ Data */}
        <div className="bg-[#0C1B2E] border border-[#1C3652] rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-xl bg-[#0E332B] text-[#34D399] w-fit mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">In-Situ CSV & ASCII Parser</h3>
            <p className="text-xs text-[#8EA7BF] mt-1 leading-relaxed">
              Ingest autonomous underwater Glider missions, OMNI moored buoys, or shipboard CTD casts in delimited text/CSV format.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#182E47] flex items-center justify-between">
            <span className="text-xs text-[#6484A3]">Supports CSV, TSV, Space-delimited</span>
            <button
              onClick={() => handleUploadSimulation(SAMPLE_DATASETS[2])}
              className="text-xs px-4 py-2 rounded-xl bg-[#142E47] hover:bg-[#1C3D61] text-[#7FDDF0] border border-[#23507D] font-medium transition-colors"
            >
              Choose .csv File
            </button>
          </div>
        </div>
      </div>

      {/* Pre-configured Samples */}
      <div className="bg-[#0C1B2E] border border-[#1C3652] rounded-2xl p-5 shadow-lg">
        <h3 className="text-xs font-semibold text-[#8EA7BF] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-[#38BDF8]" /> Pre-Configured INCOIS Data Streams (Click to Test)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_DATASETS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => handleUploadSimulation(sample)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedFile?.id === sample.id
                  ? "bg-[#0E2845] border-[#38BDF8]"
                  : "bg-[#081524] border-[#182E47] hover:border-[#264D73]"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileCode className="w-4 h-4 text-[#38BDF8] shrink-0" />
                <span className="text-xs font-semibold text-white truncate">{sample.name}</span>
              </div>
              <p className="text-[11px] text-[#7C98B3]">{sample.format} • {sample.size}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Parsed Metadata Result */}
      {ingesting ? (
        <div className="p-8 rounded-2xl bg-[#0C1B2E] border border-[#1C3652] flex items-center justify-center gap-2 text-xs text-[#7C98B3]">
          <div className="w-5 h-5 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
          <span>Parsing CF-1.6 Metadata & Variable Dimensions via Python xarray engine…</span>
        </div>
      ) : parsedData ? (
        <div className="bg-[#0C1B2E] border border-[#1C3652] rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-[#18314C] pb-3">
            <span className="text-sm font-semibold text-[#38BDF8] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#34D399]" /> {parsedData.status}
            </span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#063328] text-[#34D399] border border-[#059669]/40">
              Verified CF-1.6
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#081524] border border-[#172E47]">
              <span className="text-[#6484A3] text-[10px] uppercase block">Dimensions</span>
              <p className="font-mono text-white text-xs mt-0.5">{parsedData.dimensions}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#081524] border border-[#172E47]">
              <span className="text-[#6484A3] text-[10px] uppercase block">Extracted Variables</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {parsedData.variables.map((v) => (
                  <span key={v} className="px-2 py-0.5 rounded bg-[#132A42] text-[#38BDF8] font-mono text-[11px]">
                    {v}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#081524] border border-[#172E47] sm:col-span-2">
              <span className="text-[#6484A3] text-[10px] uppercase block">Spatial & Temporal Domain</span>
              <p className="font-mono text-white text-xs mt-0.5">{parsedData.spatialBounds} • {parsedData.timeSpan}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
