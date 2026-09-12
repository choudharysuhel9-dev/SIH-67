/**
 * frontend/src/services/oceanApi.js
 * 
 * Communication layer between React Dashboard and Suhel's FastAPI backend.
 * Endpoints:
 *  - /api/health
 *  - /api/instruments
 *  - /api/instruments/{id}/profile
 *  - /api/compare?instrument_id=...&variable=...
 *  - /api/model?variable=...&depth=...&time=...
 *  - /api/current?depth=...&time=...
 *  - /api/datasets
 * 
 * Features automatic graceful fallback so the frontend never crashes if
 * the backend is offline during live presentations.
 */

let API_BASE = "http://localhost:8001/api";

/**
 * Health check: verify if FastAPI is alive on localhost:8001 or 8000
 */
export async function checkBackendHealth() {
  for (const port of [8001, 8000]) {
    try {
      const res = await fetch(`http://localhost:${port}/api/health`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        API_BASE = `http://localhost:${port}/api`;
        const data = await res.json();
        return { online: true, data, port };
      }
    } catch (_) {}
  }
  return { online: false };
}

/**
 * Fetch instrument markers (Argo floats, gliders, buoys)
 */
export async function fetchInstruments(type) {
  for (const port of [8001, 8000]) {
    try {
      const url = type
        ? `http://localhost:${port}/api/instruments?instrument_type=${encodeURIComponent(type)}`
        : `http://localhost:${port}/api/instruments`;
      const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        API_BASE = `http://localhost:${port}/api`;
        return { success: true, instruments: data.instruments || [] };
      }
    } catch (_) {}
  }
  return { success: false };
}

/**
 * Fetch Model vs Observation comparison for an instrument (RMSE, MAE, Bias)
 */
export async function fetchComparison(instrumentId = "ARGO-001", variable = "temperature") {
  for (const port of [8001, 8000]) {
    try {
      const url = `http://localhost:${port}/api/compare?instrument_id=${encodeURIComponent(instrumentId)}&variable=${encodeURIComponent(variable)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        API_BASE = `http://localhost:${port}/api`;
        return { success: true, data };
      }
    } catch (_) {}
  }
  return { success: false };
}

/**
 * Fetch Gridded Model data for given variable/depth/time
 */
export async function fetchModelSlice(variable = "temperature", depth = 50, time = "2026-09-03T12:00:00Z") {
  try {
    const url = `${API_BASE}/model?variable=${encodeURIComponent(variable)}&depth=${depth}&time=${encodeURIComponent(time)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch Ocean Current vectors (u, v, speed, direction)
 */
export async function fetchCurrentVectors(depth = 0, time = "2026-09-03T12:00:00Z") {
  try {
    const url = `${API_BASE}/current?depth=${depth}&time=${encodeURIComponent(time)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
