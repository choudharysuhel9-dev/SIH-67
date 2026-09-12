import { useEffect } from "react";
import * as Cesium from "cesium";
import type { PickedOceanData } from "../../types/picking";
import { getPickData } from "../../utils/entityPicking";

interface PickingLayerProps {
  /** The single Viewer created and owned by OceanViewer. */
  viewer: Cesium.Viewer;
  /** Optional UI handoff point; null means a click did not hit owned data. */
  onObjectPicked?: (selection: PickedOceanData | null) => void;
}

/**
 * Owns one independent Cesium click handler for all visual data layers.
 * It observes left clicks without replacing Viewer input actions, so Cesium's
 * native camera controls and default entity selection remain available.
 */
function PickingLayer({ viewer, onObjectPicked }: PickingLayerProps) {
  useEffect(() => {
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const picked = viewer.scene.pick(movement.position);
      const selection = getPickData(picked?.id);
      onObjectPicked?.(selection ?? null);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Destroying the independent handler removes its DOM listeners and input
    // action without touching the Viewer's own camera/control handler.
    return () => {
      handler.destroy();
    };
  }, [viewer, onObjectPicked]);

  return null;
}

export default PickingLayer;
