import { useEffect, useState } from "react";
import "./App.css";
import { ExpenseTable } from "./pages/monthly-table";
import { MonthlyCaps } from "./pages/monthly-caps";
import { Analytics } from "./pages/analytics";
import "./right-nav.css";

function App() {
  useEffect(() => {}, []);

  const [navOpen, setNavOpen] = useState<boolean>(false);
  const [route, setRoute] = useState<"expenses" | "caps" | "analytics">(
    "expenses"
  );

  return (
    <div className={`app-shell ${navOpen ? "nav-open" : "nav-closed"}`}>
      <main className="app-main">
        {route === "expenses" ? (
          <ExpenseTable />
        ) : route === "caps" ? (
          <MonthlyCaps />
        ) : (
          <Analytics />
        )}
      </main>
      <RightNav
        open={navOpen}
        onToggle={() => setNavOpen((v) => !v)}
        route={route}
        onNavigate={(r) => setRoute(r)}
      />
    </div>
  );
}

export default App;

function RightNav(props: {
  open: boolean;
  onToggle: () => void;
  route: "expenses" | "caps" | "analytics";
  onNavigate: (r: "expenses" | "caps" | "analytics") => void;
}) {
  const { open, onToggle, route, onNavigate } = props;
  return (
    <aside className={`right-nav left ${open ? "open" : "closed"}`}>
      <button
        className="right-nav-toggle"
        onClick={onToggle}
        aria-label="Toggle navigation"
      >
        {open ? "→" : "←"}
      </button>
      <nav className="right-nav-content">
        <button
          className={`nav-item ${route === "expenses" ? "active" : ""}`}
          onClick={() => onNavigate("expenses")}
        >
          <span className="nav-icon" aria-hidden>
            📅
          </span>
          {open && <span className="nav-label">Expenses tables</span>}
        </button>
        <button
          className={`nav-item ${route === "caps" ? "active" : ""}`}
          onClick={() => onNavigate("caps")}
        >
          <span className="nav-icon" aria-hidden>
            🎯
          </span>
          {open && <span className="nav-label">Monthly caps</span>}
        </button>
        <button
          className={`nav-item ${route === "analytics" ? "active" : ""}`}
          onClick={() => onNavigate("analytics")}
        >
          <span className="nav-icon" aria-hidden>
            📊
          </span>
          {open && <span className="nav-label">Analytics</span>}
        </button>
      </nav>
    </aside>
  );
}
