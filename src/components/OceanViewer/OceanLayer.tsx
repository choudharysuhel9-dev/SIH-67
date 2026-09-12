import { useEffect } from "react";
import * as Cesium from "cesium";
import type { OceanGridData } from "../../types/ocean";
import { getColorForVariable } from "../../utils/colorScale";
import { getVariableMetadata } from "../../utils/oceanData";
import { attachPickData } from "../../utils/entityPicking";

interface OceanLayerProps {
  /** The single, already-created Cesium Viewer instance owned by OceanViewer. */
  viewer: Cesium.Viewer;
  data: OceanGridData;
  /** 0–1. Defaults to 0.7. */
  opacity?: number;
}

/**
 * Renders a geographic grid of a single scalar ocean variable
 * (temperature, salinity, or chlorophyll — Task 5) as colored
 * rectangle entities on the existing Cesium globe.
 *
 * OceanLayer doesn't know or care how `data` was produced — mock
 * lookup today, a real backend response later — it only reads the
 * OceanGridData shape, including `data.variable`, to pick the right
 * color gradient and unit range via getColorForVariable/
 * getVariableMetadata. This is what lets the same component render
 * temperature, salinity, or chlorophyll without three separate
 * renderers.
 *
 * This component never constructs a Cesium.Viewer itself — it only
 * ever adds/removes entities on the `viewer` instance passed in as a
 * prop, so there remains exactly one Viewer for the whole app. Each
 * grid cell is centered on one (latitude, longitude) sample and sized
 * to its neighbor spacing, so the tiles cover the full `data` extent
 * with no gaps or overlaps.
 *
 * Renders no DOM of its own (returns null) — its job is purely to
 * manage Cesium entities as a side effect. Its effect depends on
 * `data`, so switching variable OR depth (both change which
 * OceanGridData object is passed in) cleans up the previous set of
 * entities before adding the new ones — old layers never accumulate.
 */
function OceanLayer({ viewer, data, opacity = 0.7 }: OceanLayerProps) {
  useEffect(() => {
    const { latitudes, longitudes, values, variable } = data;

    if (latitudes.length === 0 || longitudes.length === 0) {
      return;
    }

    // OceanLayer only ever renders scalar fields. "current" is vector
    // data and is handled by CurrentLayer. This is a defensive fallback
    // in case a caller passes it anyway.
    const scalarVariable = variable === "current" ? "temperature" : variable;
    const { min, max } = getVariableMetadata(scalarVariable);

    // Half-cell padding around each grid point, derived from the
    // actual sample spacing rather than assumed, so this keeps working
    // if a future data source uses a different grid resolution.
    const latStep =
      latitudes.length > 1 ? Math.abs(latitudes[1] - latitudes[0]) : 1;
    const lonStep =
      longitudes.length > 1 ? Math.abs(longitudes[1] - longitudes[0]) : 1;
    const halfLat = latStep / 2;
    const halfLon = lonStep / 2;

    const addedEntities: Cesium.Entity[] = [];

    latitudes.forEach((lat, i) => {
      longitudes.forEach((lon, j) => {
        const value = values[i]?.[j];
        if (value === undefined) {
          return;
        }

        const color = getColorForVariable(scalarVariable, value, min, max).withAlpha(opacity);

        const entity = attachPickData(viewer.entities.add({
          rectangle: {
            coordinates: Cesium.Rectangle.fromDegrees(
              lon - halfLon,
              lat - halfLat,
              lon + halfLon,
              lat + halfLat
            ),
            material: color,
            height: 0,
          },
        }), {
          id: `ocean:${data.variable}:${data.depth}:${data.time}:${i}:${j}`,
          type: "ocean",
          latitude: lat,
          longitude: lon,
          depth: data.depth,
          time: data.time,
          variable: data.variable,
          value,
        });

        addedEntities.push(entity);
      });
    });

    // Remove exactly the entities this effect added, whenever the
    // viewer/data/opacity changes or the component unmounts — never
    // touch the test markers or anything else already on the viewer.
    return () => {
      addedEntities.forEach((entity) => {
        viewer.entities.remove(entity);
      });
    };
  }, [viewer, data, opacity]);

  return null;
}

export default OceanLayer;
