import { useEffect, useState } from "react";
import "./App.css";
import { ExpenseTable } from "./pages/monthly-table";
import { MonthlyCaps } from "./pages/monthly-caps";
import { Analytics } from "./pages/analytics";
import { SignIn } from "./pages/sign-in";
import { AuthProvider, useAuth } from "./auth/auth-context";
import "./right-nav.css";
import "./pages/auth.css";

const ROUTE_MOBILE_TITLE: Record<
  "expenses" | "caps" | "analytics" | "signin",
  string
> = {
  expenses: "Monthly expenses",
  caps: "Monthly caps",
  analytics: "Analytics",
  signin: "",
};

function App() {
  useEffect(() => {}, []);

  const [navOpen, setNavOpen] = useState<boolean>(false);
  const [route, setRoute] = useState<
    "expenses" | "caps" | "analytics" | "signin"
  >("expenses");

  return (
    <AuthProvider>
      <AuthedShell
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        route={route}
        setRoute={setRoute}
      />
    </AuthProvider>
  );
}

export default App;

function AuthedShell(props: {
  navOpen: boolean;
  setNavOpen: (v: boolean) => void;
  route: "expenses" | "caps" | "analytics" | "signin";
  setRoute: (r: "expenses" | "caps" | "analytics" | "signin") => void;
}) {
  const { user, loading } = useAuth();
  const { navOpen, setNavOpen, route, setRoute } = props;

  useEffect(() => {
    if (!user || loading) return;
    const mq = window.matchMedia("(max-width: 768px)");
    if (mq.matches) setNavOpen(false);
  }, [route, setNavOpen, user, loading]);

  if (loading) {
    return (
      <div className="app-shell nav-closed">
        <main
          className="app-main"
          style={{
            display: "grid",
            placeItems: "center",
            minHeight: "60vh",
          }}
        >
          <div className="app-loading">Loading…</div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`app-shell ${navOpen ? "nav-open" : "nav-closed"}`}>
        <main className="app-main">
          <SignIn />
        </main>
      </div>
    );
  }

  return (
    <div className={`app-shell ${navOpen ? "nav-open" : "nav-closed"}`}>
      <header className="mobile-app-bar" aria-label="App">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
        >
          <IconMenu />
        </button>
        <div className="mobile-app-bar-text">
          <span className="mobile-app-bar-eyebrow">Budget Buddy</span>
          <span className="mobile-app-bar-title">
            {ROUTE_MOBILE_TITLE[route]}
          </span>
        </div>
      </header>
      <main className="app-main app-main--authed">
        {route === "expenses" && <ExpenseTable />}
        {route === "caps" && <MonthlyCaps />}
        {route === "analytics" && <Analytics />}
      </main>
      <div
        className="nav-backdrop"
        onClick={() => setNavOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setNavOpen(false)}
        role="button"
        tabIndex={-1}
        aria-label="Close menu"
      />
      <RightNav
        open={navOpen}
        onToggle={() => setNavOpen(!navOpen)}
        route={route}
        onNavigate={(r) => setRoute(r)}
      />
    </div>
  );
}

function RightNav(props: {
  open: boolean;
  onToggle: () => void;
  route: "expenses" | "caps" | "analytics" | "signin";
  onNavigate: (r: "expenses" | "caps" | "analytics" | "signin") => void;
}) {
  const { open, onToggle, route, onNavigate } = props;
  const { signOut } = useAuth();
  return (
    <aside className={`right-nav left ${open ? "open" : "closed"}`}>
      <button
        className="right-nav-toggle"
        onClick={onToggle}
        aria-label="Toggle navigation"
        type="button"
      >
        {open ? <IconChevronLeft /> : <IconChevronRight />}
      </button>
      <nav className="right-nav-content">
        <button
          type="button"
          className={`nav-item ${route === "expenses" ? "active" : ""}`}
          onClick={() => onNavigate("expenses")}
        >
          <span className="nav-icon" aria-hidden>
            <IconCalendar />
          </span>
          {open && <span className="nav-label">Expenses</span>}
        </button>
        <button
          type="button"
          className={`nav-item ${route === "caps" ? "active" : ""}`}
          onClick={() => onNavigate("caps")}
        >
          <span className="nav-icon" aria-hidden>
            <IconTarget />
          </span>
          {open && <span className="nav-label">Monthly caps</span>}
        </button>
        <button
          type="button"
          className={`nav-item ${route === "analytics" ? "active" : ""}`}
          onClick={() => onNavigate("analytics")}
        >
          <span className="nav-icon" aria-hidden>
            <IconChart />
          </span>
          {open && <span className="nav-label">Analytics</span>}
        </button>
        <button type="button" className="nav-item" onClick={() => signOut()}>
          <span className="nav-icon" aria-hidden>
            <IconSignOut />
          </span>
          {open && <span className="nav-label">Sign out</span>}
        </button>
      </nav>
    </aside>
  );
}

function IconMenu() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
