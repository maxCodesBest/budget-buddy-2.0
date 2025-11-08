import { useEffect, useState } from "react";
import "./App.css";
import { ExpenseTable } from "./pages/monthly-table";
import { MonthlyCaps } from "./pages/monthly-caps";
import { Analytics } from "./pages/analytics";
// import { SignUp } from "./pages/sign-up";
import { SignIn } from "./pages/sign-in";
import { AuthProvider, useAuth } from "./auth/auth-context";
import "./right-nav.css";

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
  const { user } = useAuth();
  const { navOpen, setNavOpen, route, setRoute } = props;

  if (!user) {
    return (
      <div className={`app-shell ${navOpen ? "nav-open" : "nav-closed"}`}>
        <main className="app-main">
          <SignIn />
          {/* {route === "signup" && <SignUp />} */}
        </main>
      </div>
    );
  }

  return (
    <div className={`app-shell ${navOpen ? "nav-open" : "nav-closed"}`}>
      <main className="app-main">
        {route === "expenses" && <ExpenseTable />}
        {route === "caps" && <MonthlyCaps />}
        {route === "analytics" && <Analytics />}
      </main>
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
        {/* <button
          className={`nav-item ${route === "signup" ? "active" : ""}`}
          onClick={() => onNavigate("signup")}
        >
          <span className="nav-icon" aria-hidden>
            🔐
          </span>
          {open && <span className="nav-label">Sign up</span>}
        </button> */}
        <button className="nav-item" onClick={() => signOut()}>
          <span className="nav-icon" aria-hidden>
            🚪
          </span>
          {open && <span className="nav-label">Sign out</span>}
        </button>
      </nav>
    </aside>
  );
}
