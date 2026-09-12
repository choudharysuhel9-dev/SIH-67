import type { CurrentField } from "../types/current";
import { getCurrentDataForDepth } from "../mock/oceanCurrent";
import { DEFAULT_MOCK_TIME } from "../mock/oceanGrid";

/**
 * Current-data selector. Keeping this separate from the scalar selector lets
 * a future API-backed vector source replace the mock without changing Cesium
 * components.
 */
export function getCurrentData(
  depth: number,
  time: string = DEFAULT_MOCK_TIME
): CurrentField {
  return getCurrentDataForDepth(depth, time);
}
