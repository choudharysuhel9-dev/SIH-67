/**
 * A single ocean current sample. Unlike OceanGridData (a scalar
 * field), current data is a vector at each point — u/v components
 * plus their derived speed/direction — so it's kept as its own type
 * rather than shoehorned into OceanGridData.
 */
export interface CurrentPoint {
  latitude: number;
  longitude: number;
  /** Depth (meters) represented by this vector. */
  depth: number;
  /** ISO 8601 timestamp represented by this vector. */
  time: string;
  /** Eastward velocity component, m/s. */
  u: number;
  /** Northward velocity component, m/s. */
  v: number;
  /** Derived from u/v: sqrt(u^2 + v^2). */
  speed: number;
  /** Derived from u/v: atan2(v, u), in radians counterclockwise from east. */
  direction: number;
}

/** A set of current samples for one depth/time slice. */
export interface CurrentField {
  depth: number;
  time: string;
  points: CurrentPoint[];
}
