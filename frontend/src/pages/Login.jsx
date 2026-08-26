import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail, FiShield } from "react-icons/fi";
import { login, saveSession } from "../services/authService";
import "./Login.css";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Enter your email and password.");
            return;
        }

        setLoading(true);
        try {
            const session = await login(email.trim(), password);
            saveSession(session);
            const destination = location.state?.from?.pathname || "/dashboard";
            navigate(destination, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || "Unable to sign in. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <section className="login-shell">
                <div className="login-brand-panel">
                    <div className="brand-mark"><FiShield /></div>
                    <span className="login-eyebrow">PMSD • SECURE LEARNING</span>
                    <h1>Access your lectures securely.</h1>
                    <p>
                        Continue your courses through authorized lecture sources with a secure,
                        role-aware learning workspace.
                    </p>
                    <div className="login-trust">
                        <FiLock /> Protected access and role-based controls
                    </div>
                </div>

                <div className="login-form-panel">
                    <div className="login-heading">
                        <span className="login-eyebrow">WELCOME BACK</span>
                        <h2>Sign in</h2>
                        <p>Use your PMSD account to continue.</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        <label htmlFor="email">Email address</label>
                        <div className="login-input">
                            <FiMail />
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                disabled={loading}
                            />
                        </div>

                        <label htmlFor="password">Password</label>
                        <div className="login-input">
                            <FiLock />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Enter your password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((value) => !value)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                disabled={loading}
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>

                        {error && <div className="login-error" role="alert">{error}</div>}

                        <button className="login-submit" type="submit" disabled={loading}>
                            {loading ? "Signing in..." : "Sign in"}
                            {!loading && <FiArrowRight />}
                        </button>
                    </form>

                    <p className="login-footer">
                        Don't have an account? <Link to="/register">Create an account</Link>
                    </p>
                    <p className="login-footer">Your account role determines the workspace you can access.</p>
                </div>
            </section>
        </main>
    );
}

export default Login;
