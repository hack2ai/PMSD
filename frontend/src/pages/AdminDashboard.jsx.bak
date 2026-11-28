import { useEffect, useState } from "react";
import {
    FiActivity,
    FiAlertTriangle,
    FiBookOpen,
    FiCheckCircle,
    FiDatabase,
    FiRefreshCw,
    FiShield,
    FiUsers
} from "react-icons/fi";
import { Link } from "react-router-dom";
import RoleGuard from "../auth/RoleGuard";
import { getAdminOverview } from "../services/adminDashboardService";
import "./AdminDashboard.css";

const emptyOverview = {
    users: 0,
    courses: 0,
    enrollments: 0,
    publishedLectures: 0,
    accessToday: 0,
    deniedToday: 0,
    activeSources: 0,
    unavailableSources: 0,
    recentAudit: []
};

function AdminDashboardContent() {
    const [overview, setOverview] = useState(emptyOverview);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadOverview = async () => {
        setLoading(true);
        setError("");
        try {
            const result = await getAdminOverview();
            setOverview({ ...emptyOverview, ...(result.overview || {}) });
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load admin operations data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOverview();
    }, []);

    const cards = [
        ["Users", overview.users, FiUsers],
        ["Courses", overview.courses, FiBookOpen],
        ["Enrollments", overview.enrollments, FiActivity],
        ["Published lectures", overview.publishedLectures, FiDatabase],
        ["Access today", overview.accessToday, FiShield],
        ["Denied today", overview.deniedToday, FiAlertTriangle],
        ["Active sources", overview.activeSources, FiCheckCircle],
        ["Source health alerts", overview.unavailableSources, FiAlertTriangle]
    ];

    return (
        <main className="admin-dashboard">
            <header className="admin-dashboard-header">
                <div>
                    <span className="eyebrow">PMSD OPERATIONS</span>
                    <h1>Admin Dashboard</h1>
                    <p>Monitor learning activity, lecture access, source health, and security events.</p>
                </div>
                <button className="admin-refresh" onClick={loadOverview} disabled={loading}>
                    <FiRefreshCw className={loading ? "spin" : ""} /> Refresh
                </button>
            </header>

            {error && <div className="admin-error">{error}</div>}

            <section className="admin-kpi-grid">
                {cards.map(([label, value, Icon]) => (
                    <article className="admin-kpi" key={label}>
                        <div className="admin-kpi-icon"><Icon /></div>
                        <span>{label}</span>
                        <strong>{loading ? "—" : value}</strong>
                    </article>
                ))}
            </section>

            <section className="admin-main-grid">
                <article className="admin-panel">
                    <div className="admin-panel-heading">
                        <div>
                            <span className="eyebrow">SECURITY</span>
                            <h2>Recent audit activity</h2>
                        </div>
                        <Link to="/admin/security-audit">View all</Link>
                    </div>

                    {!overview.recentAudit.length ? (
                        <div className="admin-empty">No recent security events.</div>
                    ) : (
                        <div className="audit-list">
                            {overview.recentAudit.map((event) => (
                                <div className="audit-item" key={event.id}>
                                    <div className={`audit-dot audit-${String(event.outcome || "unknown").toLowerCase()}`} />
                                    <div>
                                        <strong>{event.action}</strong>
                                        <span>{event.reason || "No reason recorded"}</span>
                                    </div>
                                    <time>{new Date(event.created_at).toLocaleString()}</time>
                                </div>
                            ))}
                        </div>
                    )}
                </article>

                <article className="admin-panel source-health-panel">
                    <span className="eyebrow">LECTURE DELIVERY</span>
                    <h2>Source health</h2>
                    <div className="health-metric">
                        <div>
                            <strong>{overview.activeSources}</strong>
                            <span>active sources</span>
                        </div>
                        <FiCheckCircle />
                    </div>
                    <div className="health-metric warning">
                        <div>
                            <strong>{overview.unavailableSources}</strong>
                            <span>require attention</span>
                        </div>
                        <FiAlertTriangle />
                    </div>
                    <Link className="admin-action" to="/my-courses">Open learning workspace</Link>
                </article>
            </section>
        </main>
    );
}

function AdminDashboard() {
    return (
        <RoleGuard allowedRoles={["admin"]}>
            <AdminDashboardContent />
        </RoleGuard>
    );
}

export default AdminDashboard;
