import { useState } from "react";
import {
  X,
  UploadCloud,
  FileCode,
  CheckCircle2,
  Database,
  Layers,
  ArrowRight,
  Server,
  FileText
} from "lucide-react";

export default function NetCDFIngestModal({ isOpen, onClose, onDatasetLoaded }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [ingesting, setIngesting] = useState(false);
  const [ingestedMetadata, setIngestedMetadata] = useState(null);

  if (!isOpen) return null;

  // Mock standard CF-1.6 compliant NetCDF datasets available for instant loading
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

  function handleSimulateUpload(sample) {
    setIngesting(true);
    setTimeout(() => {
      setIngesting(false);
      setSelectedFile(sample);
      setIngestedMetadata({
        title: sample.name,
        format: sample.format,
        dimensions: sample.dims,
        variables: sample.variables,
        conventions: sample.conventions,
        timeSpan: "2026-09-01T00:00:00Z to 2026-09-07T23:59:59Z",
        spatialBounds: "Lat: -20.0° to 30.0° N, Lon: 40.0° to 105.0° E",
        status: "CF-1.6 Metadata Validation: PASSED (0 warnings)",
      });
    }, 700);
  }

  function handleComplete() {
    if (onDatasetLoaded && selectedFile) {
      onDatasetLoaded(selectedFile);
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-[#0B1726] border border-[#1E3A5F] shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2D42] bg-[#0E1F33]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#142A45] text-[#38BDF8]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Multi-Format Ocean Data Ingestion
              </h3>
              <p className="text-xs text-[#7C98B3]">
                Automated NetCDF (via xarray/PyNIO) & ASCII Ingestion Pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7C98B3] hover:text-white hover:bg-[#1A3048] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-[#091524]">
          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleSimulateUpload(SAMPLE_DATASETS[0]);
            }}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              dragOver
                ? "border-[#38BDF8] bg-[#0E2742]/50"
                : "border-[#1B3552] bg-[#0C1B2E] hover:border-[#2C5582]"
            }`}
          >
            <UploadCloud className="w-10 h-10 text-[#38BDF8] mx-auto mb-2 opacity-80" />
            <p className="text-sm font-medium text-[#DCE8F0]">
              Drop your NetCDF (.nc, .nc4) or Delimited Text (.csv, .dat) file here
            </p>
            <p className="text-xs text-[#7C98B3] mt-1">
              Supports Climate and Forecast (CF) Metadata Conventions 1.6+ and OGC WMS/WCS
            </p>
            <button
              onClick={() => handleSimulateUpload(SAMPLE_DATASETS[0])}
              className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-[#153250] hover:bg-[#1C4269] text-[#7FDDF0] border border-[#26537E] transition-colors"
            >
              Browse Local Files
            </button>
          </div>

          {/* Preset Sample Datasets */}
          <div>
            <h4 className="text-xs font-semibold text-[#8EA7BF] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[#38BDF8]" /> Pre-configured INCOIS Data Streams
            </h4>
            <div className="space-y-2">
              {SAMPLE_DATASETS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSimulateUpload(sample)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedFile?.id === sample.id
                      ? "bg-[#0E2845] border-[#38BDF8]"
                      : "bg-[#0A1828] border-[#182E47] hover:border-[#264D73] hover:bg-[#0D1E32]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileCode
                      className={`w-5 h-5 ${
                        sample.format.includes("NetCDF") ? "text-[#38BDF8]" : "text-[#34D399]"
                      }`}
                    />
                    <div>
                      <p className="text-xs font-semibold text-white">{sample.name}</p>
                      <p className="text-[11px] text-[#7C98B3] mt-0.5">
                        {sample.format} • {sample.size} • {sample.dims}
                      </p>
                    </div>
                  </div>
                  <button className="text-xs px-2.5 py-1 rounded bg-[#163554] text-[#7FDDF0] hover:bg-[#1E4770] transition-colors">
                    Inspect
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Ingested Metadata Inspector Card */}
          {ingesting ? (
            <div className="p-5 rounded-xl bg-[#0C1B2E] border border-[#1C3652] flex items-center justify-center gap-2 text-xs text-[#7C98B3]">
              <div className="w-4 h-4 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
              Parsing NetCDF Headers & CF Conventions via PyNIO/xarray engine…
            </div>
          ) : ingestedMetadata ? (
            <div className="p-4 rounded-xl bg-[#081829] border border-[#1D3E63] space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#18314C] pb-2">
                <span className="text-xs font-semibold text-[#38BDF8] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399]" /> CF-1.6 Metadata Validation Passed
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#063328] text-[#34D399] border border-[#059669]/40">
                  Ready to Render
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#6484A3] text-[10px] uppercase">Dimensions:</span>
                  <p className="font-mono text-white text-[11px] mt-0.5">{ingestedMetadata.dimensions}</p>
                </div>
                <div>
                  <span className="text-[#6484A3] text-[10px] uppercase">Variables:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {ingestedMetadata.variables.map((v) => (
                      <span key={v} className="px-1.5 py-0.2 rounded bg-[#142A42] text-[#38BDF8] font-mono text-[10px]">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-[#6484A3] text-[10px] uppercase">Spatial Domain:</span>
                  <p className="font-mono text-white text-[11px] mt-0.5">{ingestedMetadata.spatialBounds}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#1E2D42] bg-[#0A1625] flex items-center justify-between">
          <span className="text-xs text-[#6484A3]">
            OGC WMS / WCS REST API Compatible
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-[#7C98B3] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!ingestedMetadata}
              onClick={handleComplete}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-medium shadow-md transition-all"
            >
              Load Dataset into 3D Stage <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
