import { useState } from "react";
import type { OceanVariable } from "../../types/ocean";
import "./ControlPanel.css";

// Static list of time steps for the Task 1 placeholder slider.
// Later tasks will replace this with real time steps derived from
// NetCDF data via a service/hook instead of a hardcoded array.
const TIME_STEPS = [
  "27 Aug 2026",
  "29 Aug 2026",
  "31 Aug 2026",
  "02 Sep 2026",
  "03 Sep 2026",
  "04 Sep 2026",
  "05 Sep 2026",
  "06 Sep 2026",
  "07 Sep 2026",
  "08 Sep 2026",
];

const DEFAULT_TIME_INDEX = 6; // corresponds to "05 Sep 2026"

/**
 * Left-hand control panel.
 *
 * Task 1: all controls are local UI state only, with no data-fetching
 * or downstream side effects. Future tasks should lift this state up
 * (or move it into a hook / context) once OceanViewer needs to react
 * to these values.
 */
function ControlPanel() {
  const [variable, setVariable] = useState<OceanVariable>("temperature");
  const [depth, setDepth] = useState(100);
  const [timeIndex, setTimeIndex] = useState(DEFAULT_TIME_INDEX);
  const [opacity, setOpacity] = useState(70);

  return (
    <aside className="control-panel" aria-label="Visualization controls">
      <div>
        <span className="control-panel__heading">Data Controls</span>
      </div>

      <section className="control-section">
        <span className="control-section__title">Variable</span>
        <div className="control-field">
          <label htmlFor="variable-select" className="visually-hidden">
            Ocean variable
          </label>
          <select
            id="variable-select"
            className="control-select"
            value={variable}
            onChange={(e) => setVariable(e.target.value as OceanVariable)}
          >
            <option value="temperature">Temperature</option>
            <option value="salinity">Salinity</option>
            <option value="chlorophyll">Chlorophyll</option>
            <option value="current">Current</option>
          </select>
        </div>
      </section>

      <section className="control-section">
        <span className="control-section__title">Depth</span>
        <div className="control-field">
          <div className="control-field__row">
            <label htmlFor="depth-range">Depth (m)</label>
            <span className="control-field__value">{depth} m</span>
          </div>
          <input
            id="depth-range"
            className="control-range"
            type="range"
            min={0}
            max={500}
            step={10}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
          />
        </div>
      </section>

      <section className="control-section">
        <span className="control-section__title">Time</span>
        <div className="control-field">
          <div className="control-field__row">
            <label htmlFor="time-range">Time step</label>
            <span className="control-field__value">
              {TIME_STEPS[timeIndex]}
            </span>
          </div>
          <input
            id="time-range"
            className="control-range"
            type="range"
            min={0}
            max={TIME_STEPS.length - 1}
            step={1}
            value={timeIndex}
            onChange={(e) => setTimeIndex(Number(e.target.value))}
          />
        </div>
      </section>

      <section className="control-section">
        <span className="control-section__title">Opacity</span>
        <div className="control-field">
          <div className="control-field__row">
            <label htmlFor="opacity-range">Layer opacity</label>
            <span className="control-field__value">{opacity}%</span>
          </div>
          <input
            id="opacity-range"
            className="control-range"
            type="range"
            min={0}
            max={100}
            step={5}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
          />
        </div>
      </section>

      <section className="control-section">
        <span className="control-section__title">Future Controls</span>
        <div className="control-panel__future">
          <div className="control-panel__future-item">
            <span>Colorbar</span>
            <span className="control-panel__future-tag">Task 5</span>
          </div>
          <div className="control-panel__future-item">
            <span>Vertical Exaggeration</span>
            <span className="control-panel__future-tag">Task 2</span>
          </div>
        </div>
      </section>
    </aside>
  );
}

export default ControlPanel;
