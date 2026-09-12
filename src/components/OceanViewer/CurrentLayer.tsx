import { useEffect } from "react";
import * as Cesium from "cesium";
import type { CurrentField } from "../../types/current";
import { attachPickData } from "../../utils/entityPicking";

interface CurrentLayerProps {
  /** The single Viewer created and owned by OceanViewer. */
  viewer: Cesium.Viewer;
  data: CurrentField;
}

// Converts velocity (m/s) into a visible, proportional geographic arrow.
const ARROW_METERS_PER_METER_PER_SECOND = 120_000;
const ARROW_HEIGHT_METERS = 250;

/**
 * Renders a current field as arrowed polylines. Each endpoint is constructed
 * in the local east-north-up frame, so u (east) and v (north) map directly to
 * geographic direction even away from the equator.
 */
function CurrentLayer({ viewer, data }: CurrentLayerProps) {
  useEffect(() => {
    const addedEntities: Cesium.Entity[] = [];

    data.points.forEach((point, index) => {
      if (point.speed === 0) {
        return;
      }

      const start = Cesium.Cartesian3.fromDegrees(
        point.longitude,
        point.latitude,
        ARROW_HEIGHT_METERS
      );
      const arrowLength = point.speed * ARROW_METERS_PER_METER_PER_SECOND;
      const eastOffset = Math.cos(point.direction) * arrowLength;
      const northOffset = Math.sin(point.direction) * arrowLength;
      const localFrame = Cesium.Transforms.eastNorthUpToFixedFrame(start);
      const end = Cesium.Matrix4.multiplyByPoint(
        localFrame,
        new Cesium.Cartesian3(eastOffset, northOffset, 0),
        new Cesium.Cartesian3()
      );

      const entity = attachPickData(viewer.entities.add({
        name: "Current vector",
        polyline: {
          positions: [start, end],
          width: 3,
          arcType: Cesium.ArcType.NONE,
          material: new Cesium.PolylineArrowMaterialProperty(
            Cesium.Color.fromCssColorString("#f2c14e")
          ),
        },
      }), {
        id: `current:${point.depth}:${point.time}:${index}`,
        type: "current",
        latitude: point.latitude,
        longitude: point.longitude,
        depth: point.depth,
        time: point.time,
        u: point.u,
        v: point.v,
        speed: point.speed,
        direction: point.direction,
      });

      addedEntities.push(entity);
    });

    // Remove only vectors created by this layer before the next field is
    // rendered. Scalar cells, test markers, and the Cesium Viewer remain.
    return () => {
      addedEntities.forEach((entity) => {
        viewer.entities.remove(entity);
      });
    };
  }, [viewer, data]);

  return null;
}

export default CurrentLayer;
