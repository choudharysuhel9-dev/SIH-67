import type { OceanGridData } from "../types/ocean";
import {
  DEFAULT_MOCK_TIME,
  findNearest,
  findNearestMockTime,
  MOCK_AVAILABLE_TIMES,
  type MockOceanTime,
} from "./oceanGrid";

// ============================================================================
// MOCK / DEMO DATA — Task 3 & Task 4 only.
//
// None of these are real INCOIS ocean model values. They are small,
// deterministically generated grids used to build and test the
// depth-aware temperature visualization pipeline before a real
// backend (FastAPI / OPeNDAP) is connected in a later task. Do not
// treat any value here as scientifically meaningful.
// ============================================================================

const GRID_SIZE = 10;

const LAT_MIN = 5;
const LAT_MAX = 20;
const LON_MIN = 60;
const LON_MAX = 95;

function linspace(min: number, max: number, count: number): number[] {
  if (count <= 1) {
    return [min];
  }
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + step * i);
}

// Same geographic grid at every depth — only the values differ.
const latitudes = linspace(LAT_MIN, LAT_MAX, GRID_SIZE);
const longitudes = linspace(LON_MIN, LON_MAX, GRID_SIZE);

/**
 * Depths this mock dataset provides, in meters. A future real backend
 * may offer a different or arbitrary set of depths —
 * getTemperatureDataForDepth() below does not hard-code an assumption
 * that only these five will ever exist.
 */
export const MOCK_AVAILABLE_DEPTHS = [0, 50, 100, 200, 500] as const;

const SURFACE_TEMP_MIN = 26;
const SURFACE_TEMP_MAX = 31;

/**
 * Made-up degrees-lost-with-depth curve: cools relatively quickly in
 * the upper 200m (loosely mimicking a mixed layer + thermocline
 * shape), then more slowly below that. This is a visual demo shape,
 * not a measured or modeled thermocline.
 */
function temperatureLossForDepth(depth: number): number {
  if (depth <= 0) {
    return 0;
  }
  if (depth <= 200) {
    return (depth / 200) * 8; // up to -8°C by 200m
  }
  return 8 + ((depth - 200) / 300) * 6; // up to -14°C by 500m
}

/**
 * Deterministic, made-up temperature formula for a single depth:
 * warmer toward the equator-facing (lower latitude) edge of the grid,
 * a mild sinusoidal variation across longitude so the grid isn't a
 * flat gradient, minus the depth's temperature loss above. This has
 * no oceanographic basis — it exists only to produce a visually
 * varied, depth-distinguishable mock field.
 */
function buildMockTemperatureGrid(
  depth: number,
  time: MockOceanTime,
  timeIndex: number
): OceanGridData {
  const loss = temperatureLossForDepth(depth);

  const values: number[][] = latitudes.map((lat) =>
    longitudes.map((lon) => {
      const latitudeRatio = (LAT_MAX - lat) / (LAT_MAX - LAT_MIN);
      const base =
        SURFACE_TEMP_MIN + latitudeRatio * (SURFACE_TEMP_MAX - SURFACE_TEMP_MIN - 1.5);

      const longitudeRatio = (lon - LON_MIN) / (LON_MAX - LON_MIN);
      const variation = Math.sin(longitudeRatio * Math.PI * 2) * 0.8;
      // A small, deterministic diurnal shift plus a travelling wave makes
      // each ISO time slice visibly distinct without claiming realism.
      const diurnalOffset = [-0.6, 0, 0.8, 0.1][timeIndex];
      const temporalVariation =
        Math.cos(longitudeRatio * Math.PI * 2 + timeIndex * (Math.PI / 2)) * 0.25;

      const value = base + variation + diurnalOffset + temporalVariation - loss;
      return Math.round(value * 10) / 10;
    })
  );

  return {
    variable: "temperature",
    unit: "°C",
    depth,
    time,
    latitudes,
    longitudes,
    values,
  };
}

/**
 * MOCK temperature grids, one per available depth and ISO time. Same lat/lon
 * region and grid size as Task 3 at every slice — values differ with both
 * depth and time, so each combination produces a distinct visual field.
 * Each object is created once at module load, so repeated lookups
 * for the same depth/time return the same reference (useful for avoiding
 * unnecessary re-renders/effect re-runs downstream).
 */
export const MOCK_TEMPERATURE_BY_DEPTH_AND_TIME: Record<
  number,
  Record<MockOceanTime, OceanGridData>
> = Object.fromEntries(
  MOCK_AVAILABLE_DEPTHS.map((depth) => [
    depth,
    Object.fromEntries(
      MOCK_AVAILABLE_TIMES.map((time, timeIndex) => [
        time,
        buildMockTemperatureGrid(depth, time, timeIndex),
      ])
    ),
  ])
) as Record<number, Record<MockOceanTime, OceanGridData>>;

/** Task 3/4-compatible view of the default time slice. */
export const MOCK_TEMPERATURE_BY_DEPTH: Record<number, OceanGridData> = Object.fromEntries(
  MOCK_AVAILABLE_DEPTHS.map((depth) => [
    depth,
    MOCK_TEMPERATURE_BY_DEPTH_AND_TIME[depth][DEFAULT_MOCK_TIME],
  ])
);

const DEFAULT_DEPTH = 100;

/**
 * Returns the mock temperature grid nearest to `depth` and `time`.
 *
 * If `depth` isn't one of MOCK_AVAILABLE_DEPTHS (or is missing, NaN,
 * or negative), falls back to the nearest available depth instead of
 * throwing. An unavailable ISO timestamp is resolved to the closest available
 * mock time. This lookup is intentionally isolated here so it can be swapped
 * for a real backend request later without OceanViewer or OceanLayer needing
 * to change.
 */
export function getTemperatureDataForDepth(
  depth: number,
  time: string = DEFAULT_MOCK_TIME
): OceanGridData {
  const requested = Number.isFinite(depth) && depth >= 0 ? depth : DEFAULT_DEPTH;
  const resolvedDepth =
    MOCK_TEMPERATURE_BY_DEPTH_AND_TIME[requested] === undefined
      ? findNearest(requested, MOCK_AVAILABLE_DEPTHS)
      : requested;
  const resolvedTime = findNearestMockTime(time);

  return MOCK_TEMPERATURE_BY_DEPTH_AND_TIME[resolvedDepth][resolvedTime];
}
