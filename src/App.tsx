import Header from "./components/Header/Header";
import ControlPanel from "./components/ControlPanel/ControlPanel";
import OceanViewer from "./components/OceanViewer/OceanViewer";
import ProfilePanel from "./components/ProfilePanel/ProfilePanel";
import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <ControlPanel />
        <main className="app-body__viewer">
          {/* Task 4/5 dev/testing hook: change variable ("temperature" |
              "salinity" | "chlorophyll") and/or depth (0, 50, 100, 200,
              500) to preview a different slice, until the UI team wires
              real controls through to these props. */}
          <OceanViewer variable="temperature" depth={100} />
        </main>
        <ProfilePanel />
      </div>
    </div>
  );
}

export default App;
