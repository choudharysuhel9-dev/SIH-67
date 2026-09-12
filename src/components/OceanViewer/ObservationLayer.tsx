import { useEffect } from "react";
import * as Cesium from "cesium";
import type {
  ObservationPlatformType,
  OceanObservation,
} from "../../types/observation";
import { attachPickData } from "../../utils/entityPicking";

interface ObservationLayerProps {
  /** The single Viewer created and owned by OceanViewer. */
  viewer: Cesium.Viewer;
  observations: readonly OceanObservation[];
  /** Optional handoff point for future app/UI selection state. */
  onSelectObservation?: (observation: OceanObservation | null) => void;
}

interface MarkerStyle {
  color: string;
  svg: string;
}

const OBSERVATION_HEIGHT_METERS = 300;

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const MARKER_STYLES: Record<ObservationPlatformType, MarkerStyle> = {
  argo: {
    color: "#28c7d9",
    svg: svgDataUri(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="11" fill="#28c7d9" stroke="#07131a" stroke-width="3"/></svg>'
    ),
  },
  glider: {
    color: "#99d84a",
    svg: svgDataUri(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 3 L29 27 L3 27 Z" fill="#99d84a" stroke="#07131a" stroke-width="3" stroke-linejoin="round"/></svg>'
    ),
  },
  ctd: {
    color: "#ff9d3d",
    svg: svgDataUri(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="5" y="5" width="22" height="22" rx="2" fill="#ff9d3d" stroke="#07131a" stroke-width="3"/></svg>'
    ),
  },
  bgc: {
    color: "#c77dff",
    svg: svgDataUri(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 3 L29 16 L16 29 L3 16 Z" fill="#c77dff" stroke="#07131a" stroke-width="3" stroke-linejoin="round"/></svg>'
    ),
  },
};

/**
 * Renders source observations as independently styled Cesium billboards.
 * It owns only its entities and one selection-event subscription, so data
 * replacement never recreates the Viewer or touches other layers.
 */
function ObservationLayer({
  viewer,
  observations,
  onSelectObservation,
}: ObservationLayerProps) {
  useEffect(() => {
    const addedEntities: Cesium.Entity[] = [];
    const observationByEntity = new Map<Cesium.Entity, OceanObservation>();

    observations.forEach((observation) => {
      const style = MARKER_STYLES[observation.type];
      const entity = attachPickData(viewer.entities.add({
        name: observation.platformName ?? observation.type.toUpperCase(),
        position: Cesium.Cartesian3.fromDegrees(
          observation.longitude,
          observation.latitude,
          OBSERVATION_HEIGHT_METERS
        ),
        billboard: {
          image: style.svg,
          width: 28,
          height: 28,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        },
        label: {
          text: observation.platformName ?? observation.type.toUpperCase(),
          font: "12px Segoe UI, sans-serif",
          fillColor: Cesium.Color.fromCssColorString(style.color),
          outlineColor: Cesium.Color.fromCssColorString("#07131a"),
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -30),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        },
      }), {
        id: observation.id,
        type: observation.type,
        latitude: observation.latitude,
        longitude: observation.longitude,
        depth: observation.depth,
        time: observation.time,
        observation,
      });

      addedEntities.push(entity);
      observationByEntity.set(entity, observation);
    });

    const removeSelectionListener = viewer.selectedEntityChanged.addEventListener(
      (selectedEntity) => {
        onSelectObservation?.(
          selectedEntity ? observationByEntity.get(selectedEntity) ?? null : null
        );
      }
    );

    return () => {
      removeSelectionListener();

      // Clear an entity this layer owns before removal; never affect a marker
      // or entity owned by another layer.
      if (viewer.selectedEntity && observationByEntity.has(viewer.selectedEntity)) {
        viewer.selectedEntity = undefined;
      }

      addedEntities.forEach((entity) => {
        viewer.entities.remove(entity);
      });
    };
  }, [viewer, observations, onSelectObservation]);

  return null;
}

export default ObservationLayer;
