import { useMemo, useState } from "react";
import { useAuth } from "../auth/auth-context";
import "./auth.css";

function IconEye() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export const SignIn = () => {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const usernameError = useMemo(() => {
    if (!submitted && username.length === 0) return "";
    if (username.trim().length < 3)
      return "Username must be at least 3 characters";
    if (/\s/.test(username)) return "Username cannot contain spaces";
    return "";
  }, [username, submitted]);

  const passwordError = useMemo(() => {
    if (!submitted && password.length === 0) return "";
    if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  }, [password, submitted]);

  const isValid =
    usernameError === "" && passwordError === "" && username && password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    setServerSuccess(null);
    if (!isValid) return;
    try {
      setLoading(true);
      await signIn(username, password);
      setServerSuccess(`Welcome back, ${username}!`);
      setPassword("");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: unknown } }; message?: string };
      const raw =
        ax?.response?.data?.message ?? (err instanceof Error ? err.message : null);
      const msg = raw ?? "Failed to sign in. Please try again.";
      setServerError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img className="auth-logo" src="/logo.svg" alt="" />
          <div className="auth-brand-text">
            <span className="auth-brand-name">Budget Buddy</span>
            <span className="auth-brand-tagline">Sign in to continue</span>
          </div>
        </div>
        <header className="auth-header">
          <h2>Sign in</h2>
          <p>Access your expense data securely.</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="server-message error">{serverError}</div>
          )}
          {serverSuccess && (
            <div className="server-message success">{serverSuccess}</div>
          )}
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className={`input ${usernameError ? "invalid" : ""}`}
              autoComplete="username"
              disabled={loading}
            />
            {usernameError && (
              <div className="field-error">{usernameError}</div>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div className="password-row">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`input ${passwordError ? "invalid" : ""}`}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="show-button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
            {passwordError && (
              <div className="field-error">{passwordError}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={!isValid || loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};
