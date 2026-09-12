import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import {
  addTestMarkers,
  createOceanCesiumViewer,
  focusOnIndianOcean,
} from "./cesiumHelpers";
import OceanLayer from "./OceanLayer";
import CurrentLayer from "./CurrentLayer";
import ObservationLayer from "./ObservationLayer";
import PickingLayer from "./PickingLayer";
import { getOceanData } from "../../utils/oceanData";
import { getCurrentData } from "../../utils/currentData";
import { getObservationData } from "../../utils/observationData";
import { DEFAULT_MOCK_TIME } from "../../mock/oceanGrid";
import type { OceanVariable } from "../../types/ocean";
import type { OceanObservation } from "../../types/observation";
import type { PickedOceanData } from "../../types/picking";
import "./OceanViewer.css";

interface OceanViewerProps {
  /**
   * Which ocean variable to visualize. Scalar variables use OceanLayer;
   * "current" uses the vector-aware CurrentLayer added in Task 7.
   */
  variable?: OceanVariable;
  /**
   * Depth (meters) of the ocean data slice to visualize. Defaults to
   * 100m. See getTemperatureDataForDepth/getSalinityDataForDepth/
   * getChlorophyllDataForDepth in src/mock/ for how an
   * arbitrary/unsupported value is safely resolved to data.
   */
  depth?: number;
  /**
   * ISO 8601 timestamp for the requested data slice. The mock data selector
   * resolves unavailable timestamps to the nearest available mock time.
   */
  time?: string;
  /** Optional data injection point for future parsed/API observations. */
  observations?: readonly OceanObservation[];
  /** Optional selection handoff point for future app/UI state. */
  onObservationSelect?: (observation: OceanObservation | null) => void;
  /** Optional normalized selection handoff for any visualized data object. */
  onObjectPicked?: (selection: PickedOceanData | null) => void;
}

/**
 * Central 3D ocean visualization area.
 *
 * Task 2: mounts a real CesiumJS globe inside the reserved container
 * from Task 1. The Viewer instance is created exactly once (guarded
 * by viewerRef) and destroyed on unmount, so React re-renders from
 * unrelated state or props — including `variable`/`depth` — never
 * recreate it.
 *
 * Task 3: the created viewer is also mirrored into React state
 * (`viewer`) purely so it can be passed as a prop to <OceanLayer>,
 * which renders the ocean data grid onto that same instance. The
 * state mirror does not change the viewer's lifecycle — creation and
 * destruction are still driven entirely by the effect below, whose
 * dependency array is `[]` and does not include `variable` or `depth`.
 *
 * Task 4–7: `variable` + `depth` + `time` select either a scalar grid
 * or a current-vector field. Their dedicated layers replace only the
 * entities they own whenever their data changes, so neither path affects
 * the viewer, camera, or existing marker lifecycle.
 *
 * Task 8: observations are an independent, injectable layer that coexists
 * with either data path and exposes selection through an optional callback.
 */
function OceanViewer({
  variable = "temperature",
  depth = 100,
  time = DEFAULT_MOCK_TIME,
  observations = getObservationData(),
  onObservationSelect,
  onObjectPicked,
}: OceanViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [viewer, setViewer] = useState<Cesium.Viewer | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    // Guards against double-invocation (e.g. React StrictMode's
    // mount -> cleanup -> mount dev cycle) ever leaving two viewers
    // attached to the same container.
    if (!container || viewerRef.current) {
      return;
    }

    const createdViewer = createOceanCesiumViewer(container);
    viewerRef.current = createdViewer;
    setViewer(createdViewer);

    focusOnIndianOcean(createdViewer);
    addTestMarkers(createdViewer);

    return () => {
      createdViewer.destroy();
      viewerRef.current = null;
      setViewer(null);
    };
  }, []);

  const oceanData =
    variable === "current" ? null : getOceanData(variable, depth, time);
  const currentData =
    variable === "current" ? getCurrentData(depth, time) : null;

  return (
    <div className="ocean-viewer">
      <div className="ocean-viewer__toolbar">
        <h2 className="ocean-viewer__title">3D Ocean View</h2>
        <span className="ocean-viewer__region">Arabian Sea / Indian Ocean</span>
      </div>

      <div className="ocean-viewer__stage">
        {/* Cesium mounts its canvas + built-in widgets inside this node. */}
        <div id="cesium-container" ref={containerRef} className="cesium-container" />

        {/* Both layers render only onto this one Viewer. They own and clean up
            only their own entities when variable/depth/time changes. */}
        {viewer && oceanData && (
          <OceanLayer viewer={viewer} data={oceanData} opacity={0.7} />
        )}
        {viewer && currentData && (
          <CurrentLayer viewer={viewer} data={currentData} />
        )}
        {viewer && (
          <ObservationLayer
            viewer={viewer}
            observations={observations}
            onSelectObservation={onObservationSelect}
          />
        )}
        {viewer && <PickingLayer viewer={viewer} onObjectPicked={onObjectPicked} />}
      </div>
    </div>
  );
}

export default OceanViewer;
