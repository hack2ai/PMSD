import { useEffect, useState } from "react";
import { getSecuritySessions, revokeSecuritySession } from "../services/restrictedApi";
import "./RestrictedLearning.css";

function AdminSecurity() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadSessions = async () => {
        try {
            setLoading(true);
            const response = await getSecuritySessions();
            setSessions(response.data.sessions || []);
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load active learning sessions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
        const timer = window.setInterval(loadSessions, 30000);
        return () => window.clearInterval(timer);
    }, []);

    const revoke = async (sessionId) => {
        try {
            await revokeSecuritySession(sessionId);
            await loadSessions();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to revoke session.");
        }
    };

    return (
        <main className="security-page">
            <header className="admin-page-header">
                <div>
                    <span className="eyebrow">PMSD Security</span>
                    <h1>Active Learning Sessions</h1>
                    <p>Review current lecture sessions and revoke suspicious access.</p>
                </div>
                <button className="secondary-button" type="button" onClick={loadSessions}>Refresh</button>
            </header>

            {error && <div className="learning-error security-banner">{error}</div>}

            <section className="security-card">
                {loading ? (
                    <div className="learning-state">Loading sessions…</div>
                ) : sessions.length === 0 ? (
                    <div className="empty-state">No active lecture sessions in the last 20 minutes.</div>
                ) : (
                    <div className="security-table-wrap">
                        <table className="security-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Lecture</th>
                                    <th>Watermark</th>
                                    <th>IP</th>
                                    <th>Last seen</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((session) => (
                                    <tr key={session.id}>
                                        <td>
                                            <strong>{session.full_name}</strong>
                                            <span>{session.email}</span>
                                        </td>
                                        <td>{session.lecture_title || `Lecture #${session.lecture_id}`}</td>
                                        <td><code>{session.watermark_code || "—"}</code></td>
                                        <td>{session.ip_address || "—"}</td>
                                        <td>{new Date(session.last_seen_at).toLocaleString()}</td>
                                        <td>
                                            <button className="danger-button" type="button" onClick={() => revoke(session.id)}>
                                                Revoke
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}

export default AdminSecurity;
