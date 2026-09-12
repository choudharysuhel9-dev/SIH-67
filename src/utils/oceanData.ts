import type { OceanGridData, ScalarOceanVariable } from "../types/ocean";
import { getTemperatureDataForDepth } from "../mock/oceanTemperature";
import { getSalinityDataForDepth } from "../mock/oceanSalinity";
import { getChlorophyllDataForDepth } from "../mock/oceanChlorophyll";
import { DEFAULT_MOCK_TIME } from "../mock/oceanGrid";

export interface VariableMetadata {
  label: string;
  unit: string;
  /** Expected display range for this variable, used for consistent color-scale normalization. */
  min: number;
  max: number;
}

/**
 * Per-variable display metadata. Centralized here instead of
 * hard-coded in components, per Task 5 Step 7 — units/ranges are
 * looked up once and reused wherever needed (color mapping now,
 * a colorbar/legend later).
 */
export const OCEAN_VARIABLE_CONFIG: Record<ScalarOceanVariable, VariableMetadata> = {
  temperature: { label: "Temperature", unit: "°C", min: 10, max: 31 },
  salinity: { label: "Salinity", unit: "PSU", min: 33, max: 37 },
  chlorophyll: { label: "Chlorophyll", unit: "mg/m³", min: 0, max: 3 },
};

export function getVariableMetadata(variable: ScalarOceanVariable): VariableMetadata {
  return OCEAN_VARIABLE_CONFIG[variable];
}

const SCALAR_VARIABLES: ScalarOceanVariable[] = ["temperature", "salinity", "chlorophyll"];
const DEFAULT_VARIABLE: ScalarOceanVariable = "temperature";

function isScalarOceanVariable(value: unknown): value is ScalarOceanVariable {
  return typeof value === "string" && (SCALAR_VARIABLES as string[]).includes(value);
}

/**
 * Central mock data selector: variable + depth + time -> OceanGridData.
 *
 * This is the one seam a future OceanDataManager (real INCOIS
 * backend) would replace — swap the three mock lookups below for API
 * calls and neither OceanViewer nor OceanLayer need to change, since
 * they only ever depend on this function's OceanGridData return
 * shape, not on where the data came from.
 *
 * Falls back to temperature if `variable` isn't a recognized scalar
 * variable (e.g. an unexpected runtime value), so a bad/uninitialized
 * value from the UI can never crash the visualization. Depth and time
 * fallback (nearest available mock values) are handled inside each
 * variable's own getXDataForDepth function. `time` is optional only to
 * preserve Task 1–5 callers; every returned grid always has an ISO time.
 */
export function getOceanData(
  variable: ScalarOceanVariable,
  depth: number,
  time: string = DEFAULT_MOCK_TIME
): OceanGridData {
  const resolvedVariable = isScalarOceanVariable(variable) ? variable : DEFAULT_VARIABLE;

  switch (resolvedVariable) {
    case "salinity":
      return getSalinityDataForDepth(depth, time);
    case "chlorophyll":
      return getChlorophyllDataForDepth(depth, time);
    case "temperature":
    default:
      return getTemperatureDataForDepth(depth, time);
  }
}
