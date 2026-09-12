import type { OceanGridData } from "../types/ocean";
import {
  LAT_MIN,
  LAT_MAX,
  LON_MIN,
  LON_MAX,
  MOCK_GRID_LATITUDES,
  MOCK_GRID_LONGITUDES,
  findNearest,
  DEFAULT_MOCK_TIME,
  findNearestMockTime,
  MOCK_AVAILABLE_TIMES,
  type MockOceanTime,
} from "./oceanGrid";

// ============================================================================
// MOCK / DEMO DATA — Task 5 only.
//
// Not real INCOIS salinity measurements. A small, deterministically
// generated grid used to exercise the multi-variable visualization
// pipeline before a real backend is connected.
// ============================================================================

export const MOCK_SALINITY_DEPTHS = [0, 50, 100, 200, 500] as const;

const SURFACE_SALINITY_MIN = 33.5;
const SURFACE_SALINITY_MAX = 35.5;

/**
 * Made-up shape: salinity rises gently with depth in this mock (a
 * crude stand-in for a subsurface salinity maximum), purely so
 * depth changes are visually distinguishable. Not a real profile.
 */
function salinityGainForDepth(depth: number): number {
  return Math.min(1.5, (depth / 500) * 1.5);
}

function buildMockSalinityGrid(
  depth: number,
  time: MockOceanTime,
  timeIndex: number
): OceanGridData {
  const gain = salinityGainForDepth(depth);

  const values: number[][] = MOCK_GRID_LATITUDES.map((lat) =>
    MOCK_GRID_LONGITUDES.map((lon) => {
      const latitudeRatio = (lat - LAT_MIN) / (LAT_MAX - LAT_MIN);
      const base =
        SURFACE_SALINITY_MIN + latitudeRatio * (SURFACE_SALINITY_MAX - SURFACE_SALINITY_MIN - 0.5);

      const longitudeRatio = (lon - LON_MIN) / (LON_MAX - LON_MIN);
      const variation = Math.cos(longitudeRatio * Math.PI * 2) * 0.3;
      // Deterministic temporal variation for the four mock time slices.
      const timeOffset = [-0.12, 0.03, 0.15, 0.01][timeIndex];
      const temporalVariation =
        Math.sin(longitudeRatio * Math.PI * 2 + timeIndex * (Math.PI / 2)) * 0.08;

      const value = base + variation + gain + timeOffset + temporalVariation;
      return Math.round(value * 100) / 100;
    })
  );

  return {
    variable: "salinity",
    unit: "PSU",
    depth,
    time,
    latitudes: MOCK_GRID_LATITUDES,
    longitudes: MOCK_GRID_LONGITUDES,
    values,
  };
}

export const MOCK_SALINITY_BY_DEPTH_AND_TIME: Record<
  number,
  Record<MockOceanTime, OceanGridData>
> = Object.fromEntries(
  MOCK_SALINITY_DEPTHS.map((depth) => [
    depth,
    Object.fromEntries(
      MOCK_AVAILABLE_TIMES.map((time, timeIndex) => [
        time,
        buildMockSalinityGrid(depth, time, timeIndex),
      ])
    ),
  ])
) as Record<number, Record<MockOceanTime, OceanGridData>>;

/** Task 5-compatible view of the default time slice. */
export const MOCK_SALINITY_BY_DEPTH: Record<number, OceanGridData> = Object.fromEntries(
  MOCK_SALINITY_DEPTHS.map((depth) => [
    depth,
    MOCK_SALINITY_BY_DEPTH_AND_TIME[depth][DEFAULT_MOCK_TIME],
  ])
);

const DEFAULT_DEPTH = 100;

/** Same nearest depth/time fallback contract as getTemperatureDataForDepth. */
export function getSalinityDataForDepth(
  depth: number,
  time: string = DEFAULT_MOCK_TIME
): OceanGridData {
  const requested = Number.isFinite(depth) && depth >= 0 ? depth : DEFAULT_DEPTH;
  const resolvedDepth =
    MOCK_SALINITY_BY_DEPTH_AND_TIME[requested] === undefined
      ? findNearest(requested, MOCK_SALINITY_DEPTHS)
      : requested;
  const resolvedTime = findNearestMockTime(time);

  return MOCK_SALINITY_BY_DEPTH_AND_TIME[resolvedDepth][resolvedTime];
}
