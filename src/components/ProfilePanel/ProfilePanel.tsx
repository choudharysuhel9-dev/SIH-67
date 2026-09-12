import "./ProfilePanel.css";

/**
 * Right-hand instrument profile panel.
 *
 * Task 1: static empty state only. Task 8 will replace this with a
 * real selected Instrument (see src/types/ocean.ts) passed in as a
 * prop, and will mount a Plotly chart inside #profile-chart-container.
 */
function ProfilePanel() {
  return (
    <aside className="profile-panel" aria-label="Instrument profile">
      <h2 className="profile-panel__title">Instrument Profile</h2>

      <p className="profile-panel__empty">
        Select an Argo float or Glider to view its profile
      </p>

      <div className="profile-panel__card">
        <div className="profile-panel__card-row">
          <span className="profile-panel__card-label">Latitude</span>
          <span className="profile-panel__card-value">—</span>
        </div>
        <div className="profile-panel__card-row">
          <span className="profile-panel__card-label">Longitude</span>
          <span className="profile-panel__card-value">—</span>
        </div>
        <div className="profile-panel__card-row">
          <span className="profile-panel__card-label">Time</span>
          <span className="profile-panel__card-value">—</span>
        </div>
        <div className="profile-panel__card-row">
          <span className="profile-panel__card-label">Depth</span>
          <span className="profile-panel__card-value">—</span>
        </div>
      </div>

      {/* Dedicated mount point reserved for the future Plotly chart. */}
      <div id="profile-chart-container">Profile chart will appear here</div>
    </aside>
  );
}

export default ProfilePanel;
