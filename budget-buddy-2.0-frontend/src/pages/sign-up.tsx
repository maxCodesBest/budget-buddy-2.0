// import { useMemo, useState } from "react";
// import axios from "axios";
// import "./sign-up.css";

// export const SignUp = () => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [submitted, setSubmitted] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [serverError, setServerError] = useState<string | null>(null);
//   const [serverSuccess, setServerSuccess] = useState<string | null>(null);

//   const usernameError = useMemo(() => {
//     if (!submitted && username.length === 0) return "";
//     if (username.trim().length < 3)
//       return "Username must be at least 3 characters";
//     if (/\s/.test(username)) return "Username cannot contain spaces";
//     return "";
//   }, [username, submitted]);

//   const passwordError = useMemo(() => {
//     if (!submitted && password.length === 0) return "";
//     if (password.length < 8) return "Password must be at least 8 characters";
//     return "";
//   }, [password, submitted]);

//   const isValid =
//     usernameError === "" && passwordError === "" && username && password;

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSubmitted(true);
//     setServerError(null);
//     setServerSuccess(null);
//     if (!isValid) return;
//     try {
//       setLoading(true);
//       const res = await axios.post("http://localhost:3000/auth/sign-up", {
//         username,
//         password,
//       });
//       const value = res.data?.value ?? res.data;
//       setServerSuccess(`Account created for ${value?.username || username}.`);
//       setUsername("");
//       setPassword("");
//       setSubmitted(false);
//     } catch (err: any) {
//       const msg =
//         err?.response?.data?.message ||
//         err?.message ||
//         "Failed to sign up. Please try again.";
//       setServerError(Array.isArray(msg) ? msg.join(", ") : String(msg));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-page">
//       <div className="auth-card">
//         <header className="auth-header">
//           <h2>Create your account</h2>
//           <p>Join Budget Buddy to track your expenses with ease.</p>
//         </header>
//         <form className="auth-form" onSubmit={handleSubmit} noValidate>
//           {serverError && (
//             <div className="server-message error">{serverError}</div>
//           )}
//           {serverSuccess && (
//             <div className="server-message success">{serverSuccess}</div>
//           )}
//           <div className="form-field">
//             <label htmlFor="username">Username</label>
//             <input
//               id="username"
//               type="text"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               placeholder="Choose a username"
//               className={usernameError ? "invalid" : ""}
//               autoComplete="username"
//               disabled={loading}
//             />
//             {usernameError && (
//               <div className="field-error">{usernameError}</div>
//             )}
//           </div>

//           <div className="form-field">
//             <label htmlFor="password">Password</label>
//             <div className="password-row">
//               <input
//                 id="password"
//                 type={showPassword ? "text" : "password"}
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Create a password"
//                 className={passwordError ? "invalid" : ""}
//                 autoComplete="new-password"
//                 disabled={loading}
//               />
//               <button
//                 type="button"
//                 className="show-button"
//                 onClick={() => setShowPassword((v) => !v)}
//                 aria-label={showPassword ? "Hide password" : "Show password"}
//                 disabled={loading}
//               >
//                 {showPassword ? "🙈" : "👁️"}
//               </button>
//             </div>
//             {passwordError && (
//               <div className="field-error">{passwordError}</div>
//             )}
//             <div className="password-hint">Use at least 8 characters</div>
//           </div>

//           <button
//             type="submit"
//             className="submit-button"
//             disabled={!isValid || loading}
//           >
//             {loading ? "Creating..." : "Create account"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };
