// Shared geographic grid definition for the mock scalar/current
// datasets, so temperature/salinity/chlorophyll/current data all line
// up on the same Indian Ocean region and resolution.

export const GRID_SIZE = 10;

export const LAT_MIN = 5;
export const LAT_MAX = 20;
export const LON_MIN = 60;
export const LON_MAX = 95;

export function linspace(min: number, max: number, count: number): number[] {
  if (count <= 1) {
    return [min];
  }
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + step * i);
}

export const MOCK_GRID_LATITUDES = linspace(LAT_MIN, LAT_MAX, GRID_SIZE);
export const MOCK_GRID_LONGITUDES = linspace(LON_MIN, LON_MAX, GRID_SIZE);

/**
 * Time axis shared by every mock scalar field. Values are ISO 8601 strings
 * so the same API shape can later be used by a real data source.
 */
export const MOCK_AVAILABLE_TIMES = [
  "2026-09-07T00:00:00",
  "2026-09-07T06:00:00",
  "2026-09-07T12:00:00",
  "2026-09-07T18:00:00",
] as const;

export type MockOceanTime = (typeof MOCK_AVAILABLE_TIMES)[number];

export const DEFAULT_MOCK_TIME: MockOceanTime = MOCK_AVAILABLE_TIMES[0];

/**
 * Returns whichever of `options` is numerically closest to `value`.
 * Used everywhere a requested depth/time doesn't exactly match a
 * mock dataset, so lookups fall back gracefully instead of throwing.
 */
export function findNearest(value: number, options: readonly number[]): number {
  return options.reduce((closest, candidate) =>
    Math.abs(candidate - value) < Math.abs(closest - value) ? candidate : closest
  );
}

/**
 * Resolves a requested ISO timestamp to the closest available mock time.
 * Invalid timestamps safely use the default time, matching the depth
 * lookups' non-throwing fallback behavior.
 */
export function findNearestMockTime(time: string): MockOceanTime {
  const requestedTime = Date.parse(time);
  if (Number.isNaN(requestedTime)) {
    return DEFAULT_MOCK_TIME;
  }

  return MOCK_AVAILABLE_TIMES.reduce((closest, candidate) =>
    Math.abs(Date.parse(candidate) - requestedTime) <
    Math.abs(Date.parse(closest) - requestedTime)
      ? candidate
      : closest
  );
}
