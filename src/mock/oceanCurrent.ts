import type { CurrentField } from "../types/current";
import { createCurrentPoint } from "../utils/currentVector";
import {
  DEFAULT_MOCK_TIME,
  findNearest,
  findNearestMockTime,
  MOCK_AVAILABLE_TIMES,
  MOCK_GRID_LATITUDES,
  MOCK_GRID_LONGITUDES,
  type MockOceanTime,
} from "./oceanGrid";

// Deterministic demo vectors only; they are not measured or modeled currents.
export const MOCK_CURRENT_DEPTHS = [0, 50, 100, 200, 500] as const;

// A sparse subset avoids obscuring the scalar grid while still covering the
// same Indian Ocean extent as the Task 3–6 mock fields.
const CURRENT_LATITUDES = MOCK_GRID_LATITUDES.filter((_, index) => index % 2 === 0);
const CURRENT_LONGITUDES = MOCK_GRID_LONGITUDES.filter((_, index) => index % 2 === 0);

function roundVelocity(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function buildMockCurrentField(
  depth: number,
  time: MockOceanTime,
  timeIndex: number
): CurrentField {
  // Mock currents weaken with depth, while the phase changes each six hours.
  const depthScale = 1 - Math.min(depth / 500, 1) * 0.55;
  const phase = timeIndex * (Math.PI / 2);

  const points = CURRENT_LATITUDES.flatMap((latitude, latitudeIndex) =>
    CURRENT_LONGITUDES.map((longitude, longitudeIndex) => {
      const latitudeRatio = latitudeIndex / (CURRENT_LATITUDES.length - 1);
      const longitudeRatio = longitudeIndex / (CURRENT_LONGITUDES.length - 1);
      const northSouthOffset = latitudeRatio - 0.5;
      const eastWestOffset = longitudeRatio - 0.5;

      // A rotating gyre-like pattern gives each depth/time slice visibly
      // different U/V components without representing real ocean conditions.
      const u = depthScale * (
        0.28 - northSouthOffset * 0.22 + Math.cos(phase + longitudeRatio * Math.PI) * 0.09
      );
      const v = depthScale * (
        eastWestOffset * 0.22 + Math.sin(phase + latitudeRatio * Math.PI) * 0.12
      );

      return createCurrentPoint(
        latitude,
        longitude,
        depth,
        time,
        roundVelocity(u),
        roundVelocity(v)
      );
    })
  );

  return { depth, time, points };
}

/** Cached mock fields for every supported depth/time combination. */
export const MOCK_CURRENT_BY_DEPTH_AND_TIME: Record<
  number,
  Record<MockOceanTime, CurrentField>
> = Object.fromEntries(
  MOCK_CURRENT_DEPTHS.map((depth) => [
    depth,
    Object.fromEntries(
      MOCK_AVAILABLE_TIMES.map((time, timeIndex) => [
        time,
        buildMockCurrentField(depth, time, timeIndex),
      ])
    ),
  ])
) as Record<number, Record<MockOceanTime, CurrentField>>;

const DEFAULT_DEPTH = 100;

/**
 * Returns the field nearest to the requested depth and ISO timestamp. This
 * is the mock-data seam a real vector-data service can later replace.
 */
export function getCurrentDataForDepth(
  depth: number,
  time: string = DEFAULT_MOCK_TIME
): CurrentField {
  const requestedDepth = Number.isFinite(depth) && depth >= 0 ? depth : DEFAULT_DEPTH;
  const resolvedDepth =
    MOCK_CURRENT_BY_DEPTH_AND_TIME[requestedDepth] === undefined
      ? findNearest(requestedDepth, MOCK_CURRENT_DEPTHS)
      : requestedDepth;
  const resolvedTime = findNearestMockTime(time);

  return MOCK_CURRENT_BY_DEPTH_AND_TIME[resolvedDepth][resolvedTime];
}
