import type { OceanVariable } from "./ocean";
import type { ObservationPlatformType, OceanObservation } from "./observation";

/** Object categories that the visualization exposes to app/UI code. */
export type PickedObjectType = "ocean" | "current" | ObservationPlatformType;

/**
 * Structured result of clicking a visualization object on the globe.
 * OceanViewer's onObjectPicked prop delivers this to the UI layer —
 * the visualization engine never renders a popup/info panel itself.
 */
export interface PickedOceanData {
  /** Stable identifier of the source sample, vector, or observation. */
  id: string;
  type: PickedObjectType;
  latitude: number;
  longitude: number;
  depth?: number;
  time?: string;
  variable?: OceanVariable;
  value?: number;
  /** Eastward current component in m/s, for current vectors. */
  u?: number;
  /** Northward current component in m/s, for current vectors. */
  v?: number;
  /** Current magnitude in m/s, for current vectors. */
  speed?: number;
  /** Current direction from atan2(v, u), in radians, for current vectors. */
  direction?: number;
  observation?: OceanObservation;
}
