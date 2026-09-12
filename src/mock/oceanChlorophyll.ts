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
// Not real INCOIS chlorophyll measurements. A small, deterministically
// generated grid used to exercise the multi-variable visualization
// pipeline before a real backend is connected.
// ============================================================================

export const MOCK_CHLOROPHYLL_DEPTHS = [0, 50, 100, 200, 500] as const;

const OPEN_OCEAN_BASE = 0.15; // mg/m^3 background level, open ocean
const COASTAL_PEAK = 2.5; // mg/m^3 near the "coastal" edge of the grid

/**
 * Chlorophyll concentration falls off with depth much faster than the
 * temperature/salinity mocks (photosynthesis is a near-surface
 * process), by design, so the three variables look visually distinct
 * even at the same depth. Not a measured or modeled profile.
 */
function chlorophyllFalloffForDepth(depth: number): number {
  if (depth <= 0) {
    return 1;
  }
  return Math.max(0.05, Math.exp(-depth / 60));
}

/**
 * Deterministic, made-up spatial pattern: higher mock concentration
 * toward the western ("coastal") edge of the grid, fading toward the
 * open ocean to the east, plus a mild latitude wave — a different
 * shape than temperature/salinity's latitude-banded gradients, so
 * chlorophyll is visually distinguishable from them.
 */
function buildMockChlorophyllGrid(
  depth: number,
  time: MockOceanTime,
  timeIndex: number
): OceanGridData {
  const falloff = chlorophyllFalloffForDepth(depth);

  const values: number[][] = MOCK_GRID_LATITUDES.map((lat) =>
    MOCK_GRID_LONGITUDES.map((lon) => {
      const distanceFromCoast = (lon - LON_MIN) / (LON_MAX - LON_MIN); // 0 = coastal edge, 1 = open ocean
      const coastalBoost = Math.max(0, 1 - distanceFromCoast * 1.4);

      const latitudeRatio = (lat - LAT_MIN) / (LAT_MAX - LAT_MIN);
      const latitudeVariation = 0.85 + 0.3 * Math.sin(latitudeRatio * Math.PI);

      const surfaceValue =
        (OPEN_OCEAN_BASE + coastalBoost * (COASTAL_PEAK - OPEN_OCEAN_BASE)) * latitudeVariation;

      // Deterministic time-varying bloom signal, deliberately distinct from
      // the temperature and salinity temporal patterns.
      const bloomMultiplier = [0.85, 1.05, 1.2, 0.95][timeIndex];
      const temporalVariation =
        1 + Math.sin(distanceFromCoast * Math.PI * 2 + timeIndex * (Math.PI / 2)) * 0.1;
      const value = Math.max(0.02, surfaceValue * falloff * bloomMultiplier * temporalVariation);
      return Math.round(value * 100) / 100;
    })
  );

  return {
    variable: "chlorophyll",
    unit: "mg/m³",
    depth,
    time,
    latitudes: MOCK_GRID_LATITUDES,
    longitudes: MOCK_GRID_LONGITUDES,
    values,
  };
}

export const MOCK_CHLOROPHYLL_BY_DEPTH_AND_TIME: Record<
  number,
  Record<MockOceanTime, OceanGridData>
> = Object.fromEntries(
  MOCK_CHLOROPHYLL_DEPTHS.map((depth) => [
    depth,
    Object.fromEntries(
      MOCK_AVAILABLE_TIMES.map((time, timeIndex) => [
        time,
        buildMockChlorophyllGrid(depth, time, timeIndex),
      ])
    ),
  ])
) as Record<number, Record<MockOceanTime, OceanGridData>>;

/** Task 5-compatible view of the default time slice. */
export const MOCK_CHLOROPHYLL_BY_DEPTH: Record<number, OceanGridData> = Object.fromEntries(
  MOCK_CHLOROPHYLL_DEPTHS.map((depth) => [
    depth,
    MOCK_CHLOROPHYLL_BY_DEPTH_AND_TIME[depth][DEFAULT_MOCK_TIME],
  ])
);

const DEFAULT_DEPTH = 100;

/** Same nearest depth/time fallback contract as the other scalar mock fields. */
export function getChlorophyllDataForDepth(
  depth: number,
  time: string = DEFAULT_MOCK_TIME
): OceanGridData {
  const requested = Number.isFinite(depth) && depth >= 0 ? depth : DEFAULT_DEPTH;
  const resolvedDepth =
    MOCK_CHLOROPHYLL_BY_DEPTH_AND_TIME[requested] === undefined
      ? findNearest(requested, MOCK_CHLOROPHYLL_DEPTHS)
      : requested;
  const resolvedTime = findNearestMockTime(time);

  return MOCK_CHLOROPHYLL_BY_DEPTH_AND_TIME[resolvedDepth][resolvedTime];
}
