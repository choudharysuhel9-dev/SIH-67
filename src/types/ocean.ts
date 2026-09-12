// Core domain types for the INCOIS Ocean 3D Visualization Platform.
// These are intentionally minimal for Task 1 and designed to be extended
// in later tasks (NetCDF layers, Argo/Glider data, time series, etc.)
// without breaking existing consumers.

export type OceanVariable =
  | "temperature"
  | "salinity"
  | "chlorophyll"
  | "current";

/**
 * The subset of OceanVariable that OceanLayer/getOceanData render as a
 * scalar grid. "current" is excluded because it's vector data,
 * rendered separately by CurrentLayer from a CurrentField instead of
 * an OceanGridData.
 */
export type ScalarOceanVariable = Exclude<OceanVariable, "current">;

export interface GeoPosition {
  latitude: number;
  longitude: number;
}

export interface Instrument {
  id: string;
  type: "ARGO" | "GLIDER";
  latitude: number;
  longitude: number;
  timestamp: string;
}

// --- Forward-looking placeholders -----------------------------------------
// Not used yet in Task 1, but declared here so future tasks can extend
// this file instead of introducing parallel type definitions elsewhere.

export interface DepthRange {
  min: number;
  max: number;
  value: number;
}

export interface TimeStep {
  index: number;
  label: string;
}

export interface OceanLayerConfig {
  variable: OceanVariable;
  depth: number;
  opacity: number;
  timeStepIndex: number;
}

export interface InstrumentProfile {
  instrument: Instrument;
  depth: number[];
  values: number[];
}

/**
 * A geographic grid of a single ocean variable at a single depth and
 * ISO timestamp. Introduced in Task 3 for the mock temperature field, but
 * shaped so a FastAPI backend can later return this same structure
 * for temperature, salinity, chlorophyll, or current magnitude
 * (Task 9) without OceanLayer needing to change.
 *
 * `latitudes`/`longitudes` are the grid's cell-center coordinates
 * (evenly spaced), and `values[i][j]` is the value at
 * (latitudes[i], longitudes[j]).
 */
export interface OceanGridData {
  variable: OceanVariable;
  unit: string;
  depth: number;
  /** ISO 8601 timestamp represented by this depth slice (Task 6). */
  time: string;
  latitudes: number[];
  longitudes: number[];
  values: number[][];
}
