import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail, FiShield, FiUser } from "react-icons/fi";
import { register } from "../services/authService";
import "./Login.css";

function Register() {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!fullName.trim() || !email.trim() || !password) {
            setError("Enter your name, email, and password.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await register({
                full_name: fullName.trim(),
                email: email.trim(),
                password,
                role: "student"
            });

            setSuccess("Account created successfully. Redirecting to sign in...");
            window.setTimeout(() => navigate("/"), 900);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to create your account. Please try again.");
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
                    <h1>Create your learning account.</h1>
                    <p>
                        Register as a student to access your courses, authorized lectures,
                        and role-aware learning workspace.
                    </p>
                    <div className="login-trust">
                        <FiLock /> Protected access and role-based controls
                    </div>
                </div>

                <div className="login-form-panel">
                    <div className="login-heading">
                        <span className="login-eyebrow">WELCOME TO PMSD</span>
                        <h2>Create account</h2>
                        <p>Set up your student account to continue.</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        <label htmlFor="full-name">Full name</label>
                        <div className="login-input">
                            <FiUser />
                            <input
                                id="full-name"
                                type="text"
                                autoComplete="name"
                                value={fullName}
                                onChange={(event) => setFullName(event.target.value)}
                                placeholder="Your full name"
                                disabled={loading}
                            />
                        </div>

                        <label htmlFor="register-email">Email address</label>
                        <div className="login-input">
                            <FiMail />
                            <input
                                id="register-email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                disabled={loading}
                            />
                        </div>

                        <label htmlFor="register-password">Password</label>
                        <div className="login-input">
                            <FiLock />
                            <input
                                id="register-password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="At least 8 characters"
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

                        <label htmlFor="confirm-password">Confirm password</label>
                        <div className="login-input">
                            <FiLock />
                            <input
                                id="confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                placeholder="Re-enter your password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword((value) => !value)}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                disabled={loading}
                            >
                                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>

                        {error && <div className="login-error" role="alert">{error}</div>}
                        {success && <div className="login-success" role="status">{success}</div>}

                        <button className="login-submit" type="submit" disabled={loading}>
                            {loading ? "Creating account..." : "Create account"}
                            {!loading && <FiArrowRight />}
                        </button>
                    </form>

                    <p className="login-footer">
                        Already have an account? <Link to="/">Sign in</Link>
                    </p>
                </div>
            </section>
        </main>
    );
}

export default Register;
