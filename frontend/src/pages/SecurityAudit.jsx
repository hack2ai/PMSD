import { useEffect, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiFilter, FiRefreshCw, FiShield } from "react-icons/fi";
import { getAuditLogs } from "../services/auditService";
import RoleGuard from "../auth/RoleGuard";
import "./SecurityAudit.css";

const initialFilters = {
    action: "",
    outcome: "",
    lectureId: "",
    sourceId: "",
    from: "",
    to: "",
    limit: 25,
    offset: 0
};

const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleString();
};

function SecurityAuditContent() {
    const [filters, setFilters] = useState(initialFilters);
    const [data, setData] = useState({ logs: [], total: 0, limit: 25, offset: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadLogs = async (nextFilters = filters) => {
        setLoading(true);
        setError("");
        try {
            const result = await getAuditLogs(nextFilters);
            setData({
                logs: result.logs || [],
                total: result.total || 0,
                limit: result.limit || 25,
                offset: result.offset || 0
            });
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load security audit logs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const updateFilter = (key, value) => {
        setFilters((current) => ({ ...current, [key]: value, offset: 0 }));
    };

    const applyFilters = () => loadLogs(filters);

    const clearFilters = () => {
        setFilters(initialFilters);
        loadLogs(initialFilters);
    };

    const movePage = (direction) => {
        const nextOffset = Math.max(0, data.offset + direction * data.limit);
        const nextFilters = { ...filters, offset: nextOffset };
        setFilters(nextFilters);
        loadLogs(nextFilters);
    };

    return (
        <main className="audit-page">
            <header className="audit-header">
                <div>
                    <span className="eyebrow">SECURITY OPERATIONS</span>
                    <h1>Security Audit</h1>
                    <p>Review lecture-access decisions and administrative source activity.</p>
                </div>
                <button className="audit-refresh" onClick={() => loadLogs()} disabled={loading}>
                    <FiRefreshCw className={loading ? "spin" : ""} /> Refresh
                </button>
            </header>

            <section className="audit-summary">
                <div><FiShield /><strong>{data.total}</strong><span>Total events</span></div>
                <div><FiCheckCircle /><strong>{data.logs.filter((log) => log.outcome === "ALLOWED").length}</strong><span>Allowed on page</span></div>
                <div><FiAlertTriangle /><strong>{data.logs.filter((log) => log.outcome === "DENIED").length}</strong><span>Denied on page</span></div>
                <div><FiClock /><strong>{data.logs.length}</strong><span>Loaded events</span></div>
            </section>

            <section className="audit-filters">
                <div className="filter-title"><FiFilter /> Filters</div>
                <select value={filters.action} onChange={(e) => updateFilter("action", e.target.value)}>
                    <option value="">All actions</option>
                    <option value="LECTURE_ACCESS">Lecture access</option>
                    <option value="SOURCE_CREATED">Source created</option>
                    <option value="SOURCE_DISABLED">Source disabled</option>
                    <option value="SOURCE_STATUS_CHANGED">Source status changed</option>
                </select>
                <select value={filters.outcome} onChange={(e) => updateFilter("outcome", e.target.value)}>
                    <option value="">All outcomes</option>
                    <option value="ALLOWED">Allowed</option>
                    <option value="DENIED">Denied</option>
                </select>
                <input placeholder="Lecture ID" value={filters.lectureId} onChange={(e) => updateFilter("lectureId", e.target.value)} />
                <input placeholder="Source ID" value={filters.sourceId} onChange={(e) => updateFilter("sourceId", e.target.value)} />
                <input type="datetime-local" value={filters.from} onChange={(e) => updateFilter("from", e.target.value)} />
                <input type="datetime-local" value={filters.to} onChange={(e) => updateFilter("to", e.target.value)} />
                <div className="filter-actions">
                    <button onClick={applyFilters}>Apply</button>
                    <button className="secondary" onClick={clearFilters}>Clear</button>
                </div>
            </section>

            {error && <div className="audit-error">{error}</div>}

            <section className="audit-table-wrap">
                {loading ? (
                    <div className="audit-empty">Loading security events...</div>
                ) : !data.logs.length ? (
                    <div className="audit-empty">No audit events match the current filters.</div>
                ) : (
                    <table className="audit-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Action</th>
                                <th>Outcome</th>
                                <th>Actor</th>
                                <th>Lecture</th>
                                <th>Source</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.logs.map((log) => (
                                <tr key={log.id}>
                                    <td>{formatDate(log.created_at)}</td>
                                    <td><span className="action-code">{log.action}</span></td>
                                    <td><span className={`outcome outcome-${String(log.outcome || "unknown").toLowerCase()}`}>{log.outcome || "—"}</span></td>
                                    <td>{log.actor_user_id || "System"}</td>
                                    <td>{log.lecture_id || "—"}</td>
                                    <td>{log.source_id || "—"}</td>
                                    <td>{log.reason || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            <footer className="audit-pagination">
                <span>{data.total ? `${data.offset + 1}–${Math.min(data.offset + data.limit, data.total)} of ${data.total}` : "0 events"}</span>
                <div>
                    <button disabled={data.offset === 0 || loading} onClick={() => movePage(-1)}>Previous</button>
                    <button disabled={data.offset + data.limit >= data.total || loading} onClick={() => movePage(1)}>Next</button>
                </div>
            </footer>
        </main>
    );
}

function SecurityAudit() {
    return (
        <RoleGuard allowedRoles={["admin"]}>
            <SecurityAuditContent />
        </RoleGuard>
    );
}

export default SecurityAudit;
