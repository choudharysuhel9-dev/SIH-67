export type ObservationPlatformType = "argo" | "glider" | "ctd" | "bgc";

/** One vertical measurement in an observation's depth profile. */
export interface ObservationProfilePoint {
  depth: number;
  temperature?: number;
  salinity?: number;
  chlorophyll?: number;
}

/**
 * A single observation from an Argo float, glider, CTD cast, or BGC
 * float — real-world measured points, as opposed to OceanGridData's
 * modeled/interpolated grid. `profile` holds a vertical profile where
 * available (Argo/CTD/BGC); `track` holds an ordered path where
 * available (gliders).
 */
export interface OceanObservation {
  id: string;
  /** Observation platform category used by the visualization and future APIs. */
  type: ObservationPlatformType;
  latitude: number;
  longitude: number;
  depth?: number;
  /** ISO 8601 timestamp, when provided by the source platform. */
  time?: string;
  /** Human-readable platform or cruise identifier, when available. */
  platformName?: string;
  /**
   * Legacy alias retained for compatibility with early parsing work. New
   * producers and all visualization code should use `type`.
   */
  platformType?: ObservationPlatformType;
  temperature?: number;
  salinity?: number;
  chlorophyll?: number;
  profile?: ObservationProfilePoint[];
  track?: { latitude: number; longitude: number }[];
}
