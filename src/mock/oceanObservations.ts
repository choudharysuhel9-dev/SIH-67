import type { OceanObservation } from "../types/observation";

// Deterministic display data only. Member 4/API can replace this module with
// parsed platform observations without changing ObservationLayer.
export const MOCK_OBSERVATIONS: readonly OceanObservation[] = [
  {
    id: "argo-2901010",
    type: "argo",
    platformName: "Argo 2901010",
    latitude: 12.4,
    longitude: 68.8,
    depth: 100,
    time: "2026-09-07T00:00:00",
  },
  {
    id: "glider-sg-621",
    type: "glider",
    platformName: "Seaglider SG-621",
    latitude: 9.1,
    longitude: 77.6,
    depth: 50,
    time: "2026-09-07T06:00:00",
  },
  {
    id: "ctd-boB-014",
    type: "ctd",
    platformName: "CTD BoB-014",
    latitude: 16.8,
    longitude: 87.2,
    depth: 20,
    time: "2026-09-07T12:00:00",
  },
  {
    id: "bgc-5906205",
    type: "bgc",
    platformName: "BGC Argo 5906205",
    latitude: 6.7,
    longitude: 82.4,
    depth: 200,
    time: "2026-09-07T18:00:00",
  },
];
