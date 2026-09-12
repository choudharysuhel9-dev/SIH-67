import { MOCK_OBSERVATIONS } from "../mock/oceanObservations";
import type { OceanObservation } from "../types/observation";

/**
 * Observation-data seam for the visualization. A parsed-data service can
 * replace this mock source later without changing OceanViewer or the layer.
 */
export function getObservationData(): readonly OceanObservation[] {
  return MOCK_OBSERVATIONS;
}
