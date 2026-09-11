"""
╔══════════════════════════════════════════════════════════════════╗
║   INCOIS — 3D Ocean Visualizer API                              ║
║   Optimized NetCDF Backend                                       ║
║   Run:  python netcdf_work.py                                    ║
║   API:  http://0.0.0.0:5001                                      ║
╚══════════════════════════════════════════════════════════════════╝
"""

# ═══════════════════════════════════════════════════════════════════
# IMPORTS
# ═══════════════════════════════════════════════════════════════════
import os
import sys
import time
import logging
import threading
import numpy  as np
import pandas as pd
import xarray as xr

from datetime    import datetime
from functools   import wraps
from flask       import Flask, jsonify, request
from flask_cors  import CORS

try:
    import nest_asyncio
    nest_asyncio.apply()
except ImportError:
    pass

sys.path.append(os.path.abspath("."))

# ═══════════════════════════════════════════════════════════════════
# LOGGING SETUP
# ═══════════════════════════════════════════════════════════════════
logging.basicConfig(
    level   = logging.INFO,
    format  = "[%(asctime)s] %(levelname)s — %(message)s",
    datefmt = "%H:%M:%S"
)
log = logging.getLogger("INCOIS")

# ═══════════════════════════════════════════════════════════════════
# FLASK SETUP
# ═══════════════════════════════════════════════════════════════════
app = Flask(__name__)
CORS(app)

# ═══════════════════════════════════════════════════════════════════
# CONSTANTS — Indian EEZ Bounding Box
# ═══════════════════════════════════════════════════════════════════
EEZ = {
    "lat_min":  4.0,
    "lat_max": 24.0,
    "lon_min": 60.0,
    "lon_max": 95.0
}

# ═══════════════════════════════════════════════════════════════════
# GLOBAL STATE
# ═══════════════════════════════════════════════════════════════════
DATASET      = None   # main xarray Dataset
ARGO_DATA    = []     # list of Argo/Glider profile dicts
LOAD_TIME    = None   # when dataset was loaded
NC_FILE      = "ocean_model.nc"

# ═══════════════════════════════════════════════════════════════════
# DECORATOR — JSON error wrapper for all routes
# ═══════════════════════════════════════════════════════════════════
def handle_errors(f):
    """Catches any exception in a route and returns clean JSON error."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            return jsonify({"error": f"Bad parameter: {e}"}), 400
        except KeyError as e:
            return jsonify({"error": f"Variable not found: {e}"}), 404
        except Exception as e:
            log.exception("Unhandled error in route")
            return jsonify({"error": str(e)}), 500
    return wrapper

# ═══════════════════════════════════════════════════════════════════
# SECTION 1 — DATASET LOADING & STANDARDIZATION
# ═══════════════════════════════════════════════════════════════════

def _rename_coords(ds: xr.Dataset) -> xr.Dataset:
    """
    Auto-rename any non-standard coordinate names to:
    lat, lon, depth, time
    Handles most INCOIS / CF-convention naming variations.
    """
    rename_map = {}
    for coord in list(ds.coords) + list(ds.dims):
        c = str(coord).lower().strip()
        if   c in {"latitude",  "lats",  "lat_0", "y"}:      rename_map[coord] = "lat"
        elif c in {"longitude", "lons",  "lon_0", "x"}:      rename_map[coord] = "lon"
        elif c in {"depth_m", "z", "pres", "pressure",
                   "level", "lev", "plev"}:                   rename_map[coord] = "depth"
        elif c in {"juld", "dates", "t", "date_time"}:        rename_map[coord] = "time"

    if rename_map:
        log.info(f"Renaming coords: {rename_map}")
        ds = ds.rename(rename_map)
    return ds


def _fix_depth(ds: xr.Dataset) -> xr.Dataset:
    """
    Ensure depth is positive (some datasets store depth as negative).
    Also warn if values look like pressure (dbar) not depth (m).
    """
    if "depth" not in ds.coords:
        return ds

    depths = ds["depth"].values
    if (depths < 0).any():
        log.warning("Negative depth values found — converting to positive")
        ds["depth"] = np.abs(depths)

    if float(ds["depth"].max()) > 12000:
        log.warning("Depth max > 12000 — may be pressure (dbar) not depth (m)")

    return ds


def standardize_dataset(filepath: str) -> xr.Dataset:
    """
    Load + standardize a NetCDF file.
    Uses dask chunking for memory-safe loading of large files.
    """
    log.info(f"Loading: {filepath}")
    ds = xr.open_dataset(
        filepath,
        decode_cf = True,
        chunks    = {"time": 1, "depth": 5}   # lazy dask loading
    )
    ds = _rename_coords(ds)
    ds = _fix_depth(ds)

    log.info(f"Variables : {list(ds.data_vars.keys())}")
    log.info(f"Dimensions: {dict(ds.dims)}")

    if "lat" in ds.coords and "lon" in ds.coords:
        log.info(
            f"Lat range : {float(ds.lat.min()):.2f} → {float(ds.lat.max()):.2f}"
        )
        log.info(
            f"Lon range : {float(ds.lon.min()):.2f} → {float(ds.lon.max()):.2f}"
        )

    return ds


def create_mock_dataset(path: str) -> None:
    """
    Create a realistic mock NetCDF over the Indian EEZ.
    Used when no real data file is present.
    """
    log.warning(f"{path} not found — generating mock Indian Ocean dataset")

    n_time, n_depth = 5, 8
    n_lat,  n_lon   = 25, 25

    depths = np.array([0, 10, 25, 50, 100, 200, 300, 500], dtype=float)
    lats   = np.linspace(EEZ["lat_min"], EEZ["lat_max"], n_lat)
    lons   = np.linspace(EEZ["lon_min"], EEZ["lon_max"], n_lon)
    times  = np.arange(n_time)

    # Realistic gradients: warm surface, colder deep, saltier mid-depth
    temp = np.random.uniform(20, 30, (n_time, n_depth, n_lat, n_lon))
    salt = np.random.uniform(33, 36, (n_time, n_depth, n_lat, n_lon))
    u    = np.random.uniform(-0.8, 0.8, (n_time, n_depth, n_lat, n_lon))
    v    = np.random.uniform(-0.8, 0.8, (n_time, n_depth, n_lat, n_lon))

    for d in range(n_depth):
        temp[:, d, :, :] -= depths[d] * 0.035   # decreases with depth
        salt[:, d, :, :] += depths[d] * 0.003   # slight increase with depth

    xr.Dataset(
        {
            "temperature": (["time","depth","lat","lon"], temp,
                {"units":"degree_Celsius", "_FillValue":1e20,
                 "long_name":"Sea Water Temperature"}),
            "salinity":    (["time","depth","lat","lon"], salt,
                {"units":"PSU",            "_FillValue":1e20,
                 "long_name":"Sea Water Salinity"}),
            "u_velocity":  (["time","depth","lat","lon"], u,
                {"units":"m/s",            "_FillValue":1e20,
                 "long_name":"Eastward Sea Water Velocity"}),
            "v_velocity":  (["time","depth","lat","lon"], v,
                {"units":"m/s",            "_FillValue":1e20,
                 "long_name":"Northward Sea Water Velocity"}),
        },
        coords={
            "time":  (["time"],  times),
            "depth": (["depth"], depths, {"units":"metres", "positive":"down"}),
            "lat":   (["lat"],   lats,   {"units":"degrees_north"}),
            "lon":   (["lon"],   lons,   {"units":"degrees_east"}),
        },
        attrs={
            "title":       "Mock INCOIS Indian Ocean Model",
            "institution": "INCOIS",
            "Conventions": "CF-1.6",
            "source":      "Mock data for testing"
        }
    ).to_netcdf(path)
    log.info(f"Mock dataset saved → {path}")


# ═══════════════════════════════════════════════════════════════════
# SECTION 2 — ARRAY SANITIZATION
# ═══════════════════════════════════════════════════════════════════

def sanitize_array(da: xr.DataArray, var_name: str = "") -> np.ndarray:
    """
    Replace fill values + physically impossible values with NaN.
    Handles all common INCOIS / CF fill value conventions.
    """
    data = da.values.copy().astype(np.float64)

    # ── Replace fill values ──────────────────────────────────────
    for fv in [
        da.attrs.get("_FillValue",    None),
        da.attrs.get("missing_value", None),
        1e+20, 9.96921e+36, -9999.0, -999.0, 9999.0
    ]:
        if fv is not None:
            tol = max(abs(fv) * 1e-5, 1e-3)
            data[np.abs(data - fv) < tol] = np.nan

    # ── Physical validity ────────────────────────────────────────
    vl = var_name.lower()
    if   "temp" in vl:                          data[(data < -5)  | (data > 45)]  = np.nan
    elif "sal"  in vl:                          data[(data < 0)   | (data > 45)]  = np.nan
    elif "vel"  in vl or vl.startswith(("u","v")): data[(data < -10) | (data > 10)]  = np.nan
    elif "chlo" in vl:                          data[(data < 0)   | (data > 100)] = np.nan

    return data


def to_2d_list(arr: np.ndarray) -> list:
    """2D numpy → nested JSON-safe list (NaN → None)."""
    return [
        [None if np.isnan(v) else round(float(v), 4) for v in row]
        for row in arr
    ]


def to_1d_list(arr: np.ndarray) -> list:
    """1D numpy → flat JSON-safe list (NaN → None)."""
    return [None if np.isnan(v) else round(float(v), 4)
            for v in arr.ravel()]


def safe_stat(arr: np.ndarray, func):
    """Run np.nanmin/nanmax safely — return 0 if all NaN."""
    return 0.0 if np.all(np.isnan(arr)) else round(float(func(arr)), 4)


# ═══════════════════════════════════════════════════════════════════
# SECTION 3 — VALIDATION HELPERS
# ═══════════════════════════════════════════════════════════════════

def require_dataset():
    """Return 503 if dataset not loaded."""
    if DATASET is None:
        return jsonify({"error": "Dataset not loaded yet"}), 503
    return None


def require_variable(var: str):
    """Return 400 if variable not in dataset."""
    if var not in DATASET.data_vars:
        return jsonify({
            "error"    : f"Variable '{var}' not found",
            "available": list(DATASET.data_vars.keys())
        }), 400
    return None


def clamp_time(time_idx: int) -> int:
    """Clamp time index to valid range."""
    n = int(DATASET.dims.get("time", 1))
    return max(0, min(time_idx, n - 1))


# ═══════════════════════════════════════════════════════════════════
# SECTION 4 — API ROUTES
# ═══════════════════════════════════════════════════════════════════

# ── ROOT ────────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status":  "online",
        "service": "INCOIS NetCDF 3D Ocean Visualizer API",
        "dataset": "loaded" if DATASET is not None else "not loaded",
        "endpoints": {
            "info"      : "/api/info",
            "slice"     : "/api/slice?variable=temperature&depth=10&time_idx=0",
            "profile"   : "/api/profile?lat=15.0&lon=75.0&time_idx=0",
            "currents"  : "/api/currents?depth=0&time_idx=0&stride=8",
            "volume"    : "/api/volume?variable=temperature&time_idx=0&stride=5",
            "timeseries": "/api/timeseries?lat=15&lon=75&depth=0&variable=temperature",
            "animation" : "/api/animation?variable=temperature&depth=0",
            "eez_check" : "/api/eez/check?lat=15.0&lon=75.0",
            "argo"      : "/api/argo",
            "health"    : "/api/health"
        }
    })


# ── HEALTH CHECK ────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status"       : "ok",
        "dataset"      : "loaded" if DATASET is not None else "not loaded",
        "argo_profiles": len(ARGO_DATA),
        "load_time"    : LOAD_TIME,
        "server_time"  : datetime.utcnow().isoformat() + "Z"
    })


# ── DATASET INFO ─────────────────────────────────────────────────────
@app.route("/api/info", methods=["GET"])
@handle_errors
def get_info():
    err = require_dataset()
    if err: return err

    var_meta = {}
    for v in DATASET.data_vars:
        var_meta[v] = {
            "units"    : DATASET[v].attrs.get("units",     ""),
            "long_name": DATASET[v].attrs.get("long_name", v)
        }

    return jsonify({
        "variables"       : var_meta,
        "dimensions"      : {k: int(v) for k, v in DATASET.dims.items()},
        "times"           : [str(t)[:19] for t in DATASET["time"].values],
        "depths"          : DATASET["depth"].values.tolist(),
        "lat_range"       : [float(DATASET.lat.min()), float(DATASET.lat.max())],
        "lon_range"       : [float(DATASET.lon.min()), float(DATASET.lon.max())],
        "eez_bounding_box": EEZ,
        "global_attrs"    : {k: str(v) for k, v in DATASET.attrs.items()}
    })


# ── EEZ POINT CHECK ──────────────────────────────────────────────────
@app.route("/api/eez/check", methods=["GET"])
@handle_errors
def check_eez():
    lat = float(request.args.get("lat", 0))
    lon = float(request.args.get("lon", 0))
    inside = (EEZ["lat_min"] <= lat <= EEZ["lat_max"] and
              EEZ["lon_min"] <= lon <= EEZ["lon_max"])
    return jsonify({
        "latitude"       : lat,
        "longitude"      : lon,
        "is_inside_eez"  : inside,
        "eez_bounds"     : EEZ
    })


# ── DEPTH SLICE (2D horizontal map) ──────────────────────────────────
@app.route("/api/slice", methods=["GET"])
@handle_errors
def get_slice():
    err = require_dataset(); 
    if err: return err

    var      = request.args.get("variable", "temperature")
    err = require_variable(var); 
    if err: return err

    depth    = float(request.args.get("depth",    0))
    time_idx = clamp_time(int(request.args.get("time_idx", 0)))
    stride   = max(1, int(request.args.get("stride", 2)))

    raw  = DATASET[var].sel(depth=depth, method="nearest").isel(time=time_idx)
    data = sanitize_array(raw, var)
    sub  = data[::stride, ::stride]

    return jsonify({
        "variable"       : var,
        "units"          : DATASET[var].attrs.get("units", ""),
        "requested_depth": depth,
        "actual_depth"   : float(raw["depth"].values),
        "time"           : str(DATASET["time"].values[time_idx])[:19],
        "lats"           : DATASET["lat"].values[::stride].tolist(),
        "lons"           : DATASET["lon"].values[::stride].tolist(),
        "data"           : to_2d_list(sub),
        "shape"          : list(sub.shape),
        "vmin"           : safe_stat(sub, np.nanmin),
        "vmax"           : safe_stat(sub, np.nanmax)
    })


# ── VERTICAL PROFILE (depth chart at clicked point) ───────────────────
@app.route("/api/profile", methods=["GET"])
@handle_errors
def get_profile():
    err = require_dataset(); 
    if err: return err

    lat      = float(request.args.get("lat",      15.0))
    lon      = float(request.args.get("lon",      75.0))
    time_idx = clamp_time(int(request.args.get("time_idx", 0)))

    pt     = DATASET.sel(lat=lat, lon=lon, method="nearest").isel(time=time_idx)
    result = {
        "lat_actual": float(pt["lat"].values),
        "lon_actual": float(pt["lon"].values),
        "time"      : str(DATASET["time"].values[time_idx])[:19],
        "depths"    : DATASET["depth"].values.tolist(),
    }

    # Add all available variables to profile
    for var in DATASET.data_vars:
        if var in pt:
            arr = sanitize_array(pt[var], var)
            result[var] = to_1d_list(arr)

    return jsonify(result)


# ── CURRENT VECTORS ───────────────────────────────────────────────────
@app.route("/api/currents", methods=["GET"])
@handle_errors
def get_currents():
    err = require_dataset(); 
    if err: return err

    depth    = float(request.args.get("depth",    0))
    time_idx = clamp_time(int(request.args.get("time_idx", 0)))
    stride   = max(1, int(request.args.get("stride", 8)))   # ← stride added

    u_raw = DATASET["u_velocity"].sel(depth=depth, method="nearest").isel(time=time_idx)
    v_raw = DATASET["v_velocity"].sel(depth=depth, method="nearest").isel(time=time_idx)

    u     = sanitize_array(u_raw, "u_velocity")
    v     = sanitize_array(v_raw, "v_velocity")
    speed = np.sqrt(np.where(np.isnan(u), np.nan, u)**2 +
                    np.where(np.isnan(v), np.nan, v)**2)

    # ── Subsample to control response size ───────────────────────
    return jsonify({
        "actual_depth": float(u_raw["depth"].values),
        "time"        : str(DATASET["time"].values[time_idx])[:19],
        "stride_used" : stride,
        "lats"        : DATASET["lat"].values[::stride].tolist(),
        "lons"        : DATASET["lon"].values[::stride].tolist(),
        "u"           : to_2d_list(u    [::stride, ::stride]),
        "v"           : to_2d_list(v    [::stride, ::stride]),
        "speed"       : to_2d_list(speed[::stride, ::stride]),
        "units"       : "m/s"
    })


# ── 3D VOLUME (point cloud for Three.js / Cesium) ────────────────────
@app.route("/api/volume", methods=["GET"])
@handle_errors
def get_volume():
    err = require_dataset(); 
    if err: return err

    var       = request.args.get("variable", "temperature")
    err = require_variable(var); 
    if err: return err

    time_idx  = clamp_time(int(request.args.get("time_idx",  0)))
    stride    = max(1, int(  request.args.get("stride",    5)))
    max_depth = float(        request.args.get("max_depth", 500))
    max_pts   = int(          request.args.get("max_pts",   25000))

    # ── Subsample BEFORE loading into RAM (key fix) ───────────────
    raw = DATASET[var].isel(
        time    = time_idx,
        lat     = slice(None, None, stride),
        lon     = slice(None, None, stride),
        depth   = slice(None, None, 2)
    ).sel(depth=slice(0, max_depth)).compute()   # only NOW load

    clean = sanitize_array(raw, var)
    raw   = raw.copy(data=clean)

    df = (raw.to_dataframe()
             .reset_index()
             .dropna(subset=[var]))
    df = df[["lat","lon","depth",var]].head(max_pts)
    df[var] = df[var].round(4)

    return jsonify({
        "variable": var,
        "units"   : DATASET[var].attrs.get("units", ""),
        "time"    : str(DATASET["time"].values[time_idx])[:19],
        "count"   : len(df),
        "vmin"    : round(float(df[var].min()), 4),
        "vmax"    : round(float(df[var].max()), 4),
        "points"  : df.to_dict(orient="records")
    })


# ── TIME SERIES at fixed point ────────────────────────────────────────
@app.route("/api/timeseries", methods=["GET"])
@handle_errors
def get_timeseries():
    err = require_dataset(); 
    if err: return err

    lat   = float(request.args.get("lat",   15.0))
    lon   = float(request.args.get("lon",   75.0))
    depth = float(request.args.get("depth", 0.0))
    var   = request.args.get("variable", "temperature")
    err = require_variable(var); 
    if err: return err

    ts  = DATASET[var].sel(
        lat=lat, lon=lon, depth=depth, method="nearest"
    ).compute()

    data = sanitize_array(ts, var)

    return jsonify({
        "lat_actual"  : float(ts["lat"].values),
        "lon_actual"  : float(ts["lon"].values),
        "depth_actual": float(ts["depth"].values),
        "variable"    : var,
        "units"       : DATASET[var].attrs.get("units", ""),
        "times"       : [str(t)[:19] for t in DATASET["time"].values],
        "values"      : to_1d_list(data)
    })


# ── ANIMATION FRAMES (all time steps for one depth) ───────────────────
@app.route("/api/animation", methods=["GET"])
@handle_errors
def get_animation():
    err = require_dataset(); 
    if err: return err

    var    = request.args.get("variable", "temperature")
    err = require_variable(var); 
    if err: return err

    depth  = float(request.args.get("depth",  0.0))
    stride = max(1, int(request.args.get("stride", 4)))

    times  = DATASET["time"].values
    frames = []

    for t_idx in range(len(times)):
        raw  = DATASET[var].sel(depth=depth, method="nearest").isel(time=t_idx)
        data = sanitize_array(raw, var)
        sub  = data[::stride, ::stride]
        frames.append({
            "time_idx": t_idx,
            "time"    : str(times[t_idx])[:19],
            "data"    : to_2d_list(sub),
            "vmin"    : safe_stat(sub, np.nanmin),
            "vmax"    : safe_stat(sub, np.nanmax)
        })

    return jsonify({
        "variable": var,
        "depth"   : depth,
        "units"   : DATASET[var].attrs.get("units", ""),
        "lats"    : DATASET["lat"].values[::stride].tolist(),
        "lons"    : DATASET["lon"].values[::stride].tolist(),
        "n_frames": len(frames),
        "frames"  : frames
    })


# ── ARGO / GLIDER PROFILES ────────────────────────────────────────────
@app.route("/api/argo", methods=["GET"])
@handle_errors
def get_argo():
    float_type = request.args.get("type", None)  # 'argo' | 'glider' | None
    data = ARGO_DATA
    if float_type:
        data = [p for p in data if p.get("type") == float_type]
    return jsonify({"count": len(data), "profiles": data})


# ── UPLOAD: new NetCDF file ───────────────────────────────────────────
@app.route("/api/upload/nc", methods=["POST"])
@handle_errors
def upload_nc():
    global DATASET, LOAD_TIME

    if "file" not in request.files:
        return jsonify({"error": "No file in request"}), 400

    f = request.files["file"]
    if not f.filename.endswith(".nc"):
        return jsonify({"error": "Only .nc files accepted"}), 400

    os.makedirs("uploads", exist_ok=True)
    path = os.path.join("uploads", f.filename)
    f.save(path)

    DATASET   = standardize_dataset(path)
    LOAD_TIME = datetime.utcnow().isoformat() + "Z"

    return jsonify({
        "status"    : "loaded",
        "file"      : f.filename,
        "variables" : list(DATASET.data_vars.keys()),
        "dimensions": {k: int(v) for k, v in DATASET.dims.items()}
    })


# ── UPLOAD: Argo CSV ──────────────────────────────────────────────────
@app.route("/api/upload/argo", methods=["POST"])
@handle_errors
def upload_argo():
    global ARGO_DATA

    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    f = request.files["file"]
    os.makedirs("uploads", exist_ok=True)
    path = os.path.join("uploads", f.filename)
    f.save(path)

    df = pd.read_csv(path)
    df.columns = [c.lower().strip() for c in df.columns]

    rename = {
        "latitude": "lat", "longitude": "lon",
        "pres": "depth", "temp": "temperature", "psal": "salinity"
    }
    df = df.rename(columns=rename)
    df = df.dropna(subset=["lat","lon"])

    group_col = next(
        (c for c in ["float_id","platform_number","glider_id"]
         if c in df.columns),
        df.columns[0]
    )

    new_profiles = []
    for gid, grp in df.groupby(group_col):
        grp = grp.sort_values("depth") if "depth" in grp else grp
        new_profiles.append({
            "float_id"   : str(gid),
            "lat"        : float(grp["lat"].iloc[0]),
            "lon"        : float(grp["lon"].iloc[0]),
            "time"       : str(grp["time"].iloc[0]) if "time" in grp else "N/A",
            "depth"      : grp["depth"].tolist()       if "depth"       in grp else [],
            "temperature": grp["temperature"].tolist() if "temperature" in grp else [],
            "salinity"   : grp["salinity"].tolist()    if "salinity"    in grp else [],
            "type"       : "argo"
        })

    ARGO_DATA.extend(new_profiles)
    return jsonify({
        "status": "loaded",
        "new"   : len(new_profiles),
        "total" : len(ARGO_DATA)
    })


# ═══════════════════════════════════════════════════════════════════
# SECTION 5 — SERVER STARTUP
# ═══════════════════════════════════════════════════════════════════

def load_data():
    """Load dataset at startup. Creates mock if file missing."""
    global DATASET, LOAD_TIME

    if not os.path.exists(NC_FILE):
        create_mock_dataset(NC_FILE)

    DATASET   = standardize_dataset(NC_FILE)
    LOAD_TIME = datetime.utcnow().isoformat() + "Z"
    log.info("Dataset ready.")


def start_server():
    app.run(
        host        = "0.0.0.0",
        port        = 5001,
        debug       = False,
        use_reloader= False,
        threaded    = True    # handle multiple requests concurrently
    )


if __name__ == "__main__":
    print("=" * 60)
    print("  INCOIS — NetCDF Ocean Visualizer API")
    print("=" * 60)
    load_data()
    log.info("Starting server on http://0.0.0.0:5001")
    start_server()

else:
    # When imported (e.g. in Colab / Jupyter)
    load_data()
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(1.5)
    print("✅ API LIVE → http://127.0.0.1:5001")
    print("   Health  → http://127.0.0.1:5001/api/health")
