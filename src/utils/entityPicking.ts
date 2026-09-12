import type { Entity } from "cesium";
import type { PickedOceanData } from "../types/picking";

const PICK_DATA_KEY = "__incoisPickData";

type PickableEntity = Entity & {
  [PICK_DATA_KEY]?: PickedOceanData;
};

/** Associates normalized source data with a Cesium entity owned by a layer. */
export function attachPickData(entity: Entity, data: PickedOceanData): Entity {
  (entity as PickableEntity)[PICK_DATA_KEY] = data;
  return entity;
}

/** Reads normalized data from a value returned by Cesium's scene.pick(). */
export function getPickData(entity: unknown): PickedOceanData | undefined {
  if (typeof entity !== "object" || entity === null) {
    return undefined;
  }

  return (entity as PickableEntity)[PICK_DATA_KEY];
}
