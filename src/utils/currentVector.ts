import type { CurrentPoint } from "../types/current";

/** Returns current magnitude in m/s from eastward/northward components. */
export function calculateCurrentSpeed(u: number, v: number): number {
  return Math.sqrt(u ** 2 + v ** 2);
}

/**
 * Returns the direction a current flows toward, in radians counterclockwise
 * from east. This is the direct atan2(v, u) form for eastward (u) and
 * northward (v) components.
 */
export function calculateCurrentDirection(u: number, v: number): number {
  return Math.atan2(v, u);
}

/** Builds a current point and keeps derived speed/direction in one place. */
export function createCurrentPoint(
  latitude: number,
  longitude: number,
  depth: number,
  time: string,
  u: number,
  v: number
): CurrentPoint {
  return {
    latitude,
    longitude,
    depth,
    time,
    u,
    v,
    speed: calculateCurrentSpeed(u, v),
    direction: calculateCurrentDirection(u, v),
  };
}
