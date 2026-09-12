"""
ocean_data_layer.adapters
=========================
Source-specific adapters that read raw ocean data and produce
a CommonOceanDataset conforming to the canonical contract.

Each adapter is a separate module in this package.
All adapters inherit from BaseOceanAdapter.

Phase 1 adapter:
    CopernicusNetCDFAdapter — reads GLORYS12V1-style NetCDF files.

Future adapters (implement only when real code/data exists):
    ArgoAdapter
    GliderAdapter
    CSVOceanAdapter
"""
