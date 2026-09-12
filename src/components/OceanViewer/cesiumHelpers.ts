import * as Cesium from "cesium";

/**
 * Task 2 uses a small local marker type instead of extending
 * src/types/ocean.ts. These are throwaway test geometry, not real
 * Argo/Glider observations, so they intentionally don't touch the
 * shared Instrument type.
 */
export interface TestMarker {
  name: string;
  latitude: number;
  longitude: number;
}

export const INDIAN_OCEAN_TEST_MARKERS: TestMarker[] = [
  { name: "India", latitude: 20.6, longitude: 78.9 },
  { name: "Arabian Sea", latitude: 14, longitude: 66 },
  { name: "Bay of Bengal", latitude: 15, longitude: 88 },
  { name: "Indian Ocean", latitude: 5, longitude: 75 },
];

/**
 * Creates a Cesium Viewer mounted on `container`.
 *
 * Uses the Natural Earth II imagery bundled with the `cesium` package
 * as the base layer instead of Cesium ion's default Bing imagery, so
 * the globe renders immediately with no ion account or access token
 * required. Widgets unrelated to Task 2 (timeline, animation, geocoder,
 * etc.) are turned off to match the restrained dashboard look from
 * Task 1 — normal mouse/touch navigation (rotate/zoom/pan) still works,
 * since that comes from the scene's default camera controller, not
 * from these UI widgets.
 */
export function createOceanCesiumViewer(container: HTMLDivElement): Cesium.Viewer {
  const baseLayer = Cesium.ImageryLayer.fromProviderAsync(
    Cesium.TileMapServiceImageryProvider.fromUrl(
      Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII")
    )
  );

  const viewer = new Cesium.Viewer(container, {
    baseLayer,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
  });

  configureCameraNavigation(viewer);

  return viewer;
}

/**
 * Tunes the native screen-space camera controller so mouse-wheel zoom
 * feels smooth and bounded, instead of relying on Cesium's untouched
 * defaults.
 *
 * Root cause this addresses: Cesium's out-of-the-box defaults are
 * `minimumZoomDistance: 1.0` (meters) and `maximumZoomDistance:
 * Infinity`, with `zoomFactor: 5.0`. Combined with an initial camera
 * height of several thousand kilometers, that combination lets the
 * camera zoom in far enough to clip through the globe surface, zoom
 * out indefinitely, and take unevenly large steps per wheel tick
 * (fine-grained near the surface, huge at high altitude) — which
 * reads as "jumpy" or "stuck" zooming. Explicitly bounding these
 * values keeps every zoom step proportional and predictable across
 * the full global-view -> coastal-view range.
 *
 * This only configures Cesium's built-in controller — no manual
 * wheel/event listeners are added, so native left-drag rotate,
 * right-drag tilt, and touch gestures are left untouched.
 */
export function configureCameraNavigation(viewer: Cesium.Viewer): void {
  const controller = viewer.scene.screenSpaceCameraController;

  // Keep all native navigation inputs (rotate/tilt/pan/zoom) enabled.
  controller.enableInputs = true;

  // Floor: ~300m above the surface. Close enough for a coastal/India
  // close-up view, but prevents the camera clipping through the
  // globe/terrain at very close range.
  controller.minimumZoomDistance = 300;

  // Ceiling: ~25,000km. Comfortably fits a full-globe view but stops
  // an errant scroll from sending the camera off into deep space.
  controller.maximumZoomDistance = 25_000_000;

  // Gentler per-tick zoom than Cesium's default (5.0), so each wheel
  // step feels like a smooth, controlled increment rather than a
  // large jump, at any altitude between the bounds above.
  controller.zoomFactor = 3;

  // Cesium's own default; kept explicit so the smooth-deceleration
  // behavior on each zoom step is a deliberate, documented choice
  // rather than an unconfigured default.
  controller.inertiaZoom = 0.8;
}

/**
 * Frames the initial camera so India, the Arabian Sea, the Bay of
 * Bengal, and the wider Indian Ocean are all visible on load.
 *
 * Positioned using geographic (longitude/latitude/height) coordinates
 * via Cesium.Cartesian3.fromDegrees rather than a hand-picked Cartesian
 * vector, looking straight down (-90° pitch) from 6,000 km up.
 */
export function focusOnIndianOcean(viewer: Cesium.Viewer): void {
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(78, 12, 6_000_000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
  });
}

/**
 * Adds labeled point entities for a small set of test locations, to
 * demonstrate that geographic entities render correctly on the globe.
 *
 * These are placeholders only. Task 7 will replace this function's
 * call site with real Argo/Glider positions (using the Instrument type
 * from src/types/ocean.ts) instead of the hardcoded TestMarker list.
 */
export function addTestMarkers(
  viewer: Cesium.Viewer,
  markers: TestMarker[] = INDIAN_OCEAN_TEST_MARKERS
): void {
  markers.forEach((marker) => {
    viewer.entities.add({
      name: marker.name,
      position: Cesium.Cartesian3.fromDegrees(marker.longitude, marker.latitude),
      point: {
        pixelSize: 10,
        color: Cesium.Color.fromCssColorString("#2fb8c6"),
        outlineColor: Cesium.Color.fromCssColorString("#0a0e14"),
        outlineWidth: 2,
      },
      label: {
        text: marker.name,
        font: "12px Segoe UI, sans-serif",
        fillColor: Cesium.Color.WHITE,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        outlineColor: Cesium.Color.fromCssColorString("#0a0e14"),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -12),
      },
    });
  });
}
