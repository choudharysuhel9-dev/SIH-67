"""
app/services/current_service.py

Backs GET /api/current.

Reuses model_service's validation and mock value generator for
current_u/current_v so the same grid/values stay consistent with
whatever /api/model would return for those variables.

speed = sqrt(u^2 + v^2)
direction = atan2(v, u), converted to compass-style degrees (0-360,
clockwise from east) for Member 1 to rotate arrow sprites in Cesium.
"""

import math
from typing import List

from app.schemas.current import CurrentPoint, CurrentResponse
from app.services.model_service import (
    validate_depth,
    validate_time,
    
)

# A coarser grid than /api/model - arrows every 3rd grid point avoids
# an unreadably dense arrow field on the frontend.
from app.services import netcdf_service


def get_current(depth: float, time: str) -> CurrentResponse:
    validate_depth(depth)
    validate_time(time)

    u_data = netcdf_service.get_model_data(
        variable="current_u",
        depth=depth,
        time=time,
    )

    v_data = netcdf_service.get_model_data(
        variable="current_v",
        depth=depth,
        time=time,
    )

    points = []

    for lat_idx, lat in enumerate(u_data["latitudes"]):
        for lon_idx, lon in enumerate(u_data["longitudes"]):

            u = u_data["values"][lat_idx][lon_idx]
            v = v_data["values"][lat_idx][lon_idx]

            if u is None or v is None:
                continue

            speed = round(math.sqrt(u**2 + v**2), 3)
            direction = round(math.degrees(math.atan2(v, u)) % 360, 2)

            points.append(
                CurrentPoint(
                    latitude=lat,
                    longitude=lon,
                    u=u,
                    v=v,
                    speed=speed,
                    direction=direction,
                )
            )

    return CurrentResponse(
        depth=depth,
        time=time,
        points=points,
    )