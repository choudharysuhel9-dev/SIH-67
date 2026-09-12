# SIH-67
PROBLEM : Develop a web-based interactive 3D visualization platform that integrates numerical ocean model outputs and in-situ observations

# INCOIS 3D Ocean Visualization Platform

An interactive web-based 3D ocean visualization platform developed for visualizing ocean model outputs and in-situ observations over the Indian Ocean.

The frontend is built using React, TypeScript, and CesiumJS to provide an interactive 3D geographic visualization environment.

---

## Project Overview

India has a large Exclusive Economic Zone (EEZ) and extensive coastline that requires continuous monitoring of ocean conditions.

This project aims to provide an interactive 3D platform for visualizing:

- Ocean temperature
- Ocean salinity
- Chlorophyll concentration
- Ocean currents
- Argo observations
- Glider observations
- CTD observations
- BGC observations

The platform supports visualization across different depths and time steps while maintaining an interactive 3D globe.

---

## Current Branch

**Branch:** `3d frontend`

This branch contains the work of:

### Member 1 — 3D Frontend Lead

Responsibilities:

- React frontend
- TypeScript
- CesiumJS
- 3D globe visualization
- Ocean layer rendering
- Depth and time visualization
- Current vector visualization
- Observation visualization
- Camera controls
- Geographic positioning
- Data picking and interaction

---

# Technology Stack

- React
- TypeScript
- CesiumJS
- Vite
- JavaScript/HTML/CSS

---

# Current Features

## 1. 3D Cesium Globe

- Interactive 3D globe
- India / Indian Ocean focused camera view
- Zoom, pan and rotation
- Geographic coordinate positioning

## 2. Ocean Temperature Visualization

Temperature values are visualized spatially using a color scale.

## 3. Depth-Aware Visualization

Ocean data can be visualized at different depth levels.

Example:

```text
0 m
50 m
100 m
200 m
500 m
