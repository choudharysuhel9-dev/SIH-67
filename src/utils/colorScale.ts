import * as Cesium from "cesium";
import type { ScalarOceanVariable } from "../types/ocean";

// Each scalar variable gets its own visually distinct gradient
// instead of reusing one warm/cool scale for everything — a reader
// should be able to tell temperature, salinity, and chlorophyll
// layers apart by color family alone.
const GRADIENTS: Record<ScalarOceanVariable, Cesium.Color[]> = {
  temperature: [
    Cesium.Color.fromCssColorString("#2b6cb0"), // cool
    Cesium.Color.fromCssColorString("#38b2ac"),
    Cesium.Color.fromCssColorString("#ecc94b"),
    Cesium.Color.fromCssColorString("#e53e3e"), // warm
  ],
  salinity: [
    Cesium.Color.fromCssColorString("#dbeafe"), // fresher
    Cesium.Color.fromCssColorString("#60a5fa"),
    Cesium.Color.fromCssColorString("#2563eb"),
    Cesium.Color.fromCssColorString("#4c1d95"), // saltier
  ],
  chlorophyll: [
    Cesium.Color.fromCssColorString("#fefce8"), // low
    Cesium.Color.fromCssColorString("#a3e635"),
    Cesium.Color.fromCssColorString("#16a34a"),
    Cesium.Color.fromCssColorString("#14532d"), // high (bloom-like)
  ],
};

/**
 * Maps a scalar value to a color by linearly interpolating across a
 * fixed gradient, after normalizing `value` into [min, max]. Generic
 * over any gradient, so it also backs the current-speed color scale
 * in CurrentLayer.
 */
export function valueToColor(
  value: number,
  min: number,
  max: number,
  gradient: Cesium.Color[]
): Cesium.Color {
  const clamped = Math.min(max, Math.max(min, value));
  const normalized = max === min ? 0 : (clamped - min) / (max - min);

  const segmentCount = gradient.length - 1;
  const scaled = normalized * segmentCount;
  const segmentIndex = Math.min(segmentCount - 1, Math.floor(scaled));
  const segmentT = scaled - segmentIndex;

  return Cesium.Color.lerp(
    gradient[segmentIndex],
    gradient[segmentIndex + 1],
    segmentT,
    new Cesium.Color()
  );
}

/** Maps a value to a color using the gradient appropriate for `variable`. */
export function getColorForVariable(
  variable: ScalarOceanVariable,
  value: number,
  min: number,
  max: number
): Cesium.Color {
  return valueToColor(value, min, max, GRADIENTS[variable]);
}
