import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyCourses } from "../services/courseService";
import "./Dashboard.css";

const getStoredUser = () => {
    try {
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

function Dashboard() {
    const user = getStoredUser();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getMyCourses()
            .then((data) => setCourses(data.courses || data.data || []))
            .catch((err) => setError(err.response?.data?.message || "Unable to load courses."))
            .finally(() => setLoading(false));
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return (
        <main className="student-dashboard">
            <header className="sd-header">
                <div>
                    <span className="eyebrow">PMSD · SECURE LEARNING</span>
                    <h1>{greeting}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}.</h1>
                    <p>Your learning workspace — enrolled courses, lectures, and progress.</p>
                </div>
                <nav className="sd-nav">
                    <Link className="sd-nav-link" to="/my-courses">My Courses</Link>
                    <Link className="sd-nav-link sd-nav-primary" to="/my-courses">Continue learning →</Link>
                </nav>
            </header>

            <section className="sd-stats">
                <article className="sd-stat">
                    <span className="sd-stat-label">Enrolled courses</span>
                    <strong className="sd-stat-value">{loading ? "—" : courses.length}</strong>
                </article>
                <article className="sd-stat">
                    <span className="sd-stat-label">Role</span>
                    <strong className="sd-stat-value" style={{ textTransform: "capitalize" }}>{user?.role || "student"}</strong>
                </article>
                <article className="sd-stat">
                    <span className="sd-stat-label">Account</span>
                    <strong className="sd-stat-value sd-stat-email">{user?.email || "—"}</strong>
                </article>
            </section>

            {error && <div className="sd-error">{error}</div>}

            <section className="sd-courses-section">
                <div className="sd-section-heading">
                    <div>
                        <span className="eyebrow">ENROLLED</span>
                        <h2>Your Courses</h2>
                    </div>
                    <Link to="/my-courses" className="sd-view-all">View all →</Link>
                </div>
                {loading ? (
                    <div className="sd-state">Loading your courses…</div>
                ) : !courses.length ? (
                    <div className="sd-empty">
                        <p>You have no enrolled courses yet.</p>
                        <p style={{ color: "#667085", fontSize: "14px" }}>Once you enroll, your courses will appear here.</p>
                    </div>
                ) : (
                    <div className="sd-course-grid">
                        {courses.slice(0, 6).map((course) => (
                            <article className="sd-course-card" key={course.id}>
                                <div className="sd-course-badge">ENROLLED COURSE</div>
                                <h3>{course.title || course.name || `Course #${course.id}`}</h3>
                                <p>{course.description ? course.description.slice(0, 100) + (course.description.length > 100 ? "…" : "") : "Explore the modules and continue learning."}</p>
                                <Link to="/my-courses" className="sd-course-cta">Open course →</Link>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="sd-quick-links">
                <div className="sd-section-heading">
                    <div>
                        <span className="eyebrow">WORKSPACE</span>
                        <h2>Quick access</h2>
                    </div>
                </div>
                <div className="sd-links-grid">
                    <Link to="/my-courses" className="sd-link-card">
                        <span className="sd-link-icon">📚</span>
                        <strong>My Courses</strong>
                        <span>Browse enrolled courses and modules</span>
                    </Link>
                    <Link to="/my-courses" className="sd-link-card">
                        <span className="sd-link-icon">🎓</span>
                        <strong>Certificates</strong>
                        <span>View your earned certificates</span>
                    </Link>
                    <Link to="/my-courses" className="sd-link-card">
                        <span className="sd-link-icon">📈</span>
                        <strong>Progress</strong>
                        <span>Track your lecture progress</span>
                    </Link>
                </div>
            </section>
        </main>
    );
}

export default Dashboard;