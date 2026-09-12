import "./Header.css";

/**
 * Application header.
 *
 * Task 1: static branding + a system status indicator only.
 * Later tasks may pass real connection/system state in as props
 * instead of the current hardcoded "System Ready" label.
 */
function Header() {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo" aria-hidden="true">
          IO
        </span>
        <h1 className="app-header__title">INCOIS Ocean 3D</h1>
        <span className="app-header__subtitle">
          Interactive Ocean Data Visualization
        </span>
      </div>

      <div className="app-header__status" role="status">
        <span className="app-header__status-dot" aria-hidden="true" />
        <span>System Ready</span>
      </div>
    </header>
  );
}

export default Header;
