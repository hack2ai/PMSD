import { useEffect, useState } from "react";
import { FiActivity, FiCheckCircle, FiPlus, FiSlash, FiTrash2 } from "react-icons/fi";
import { useParams } from "react-router-dom";
import {
    checkLectureSourceHealth,
    createLectureSource,
    deactivateLectureSource,
    getLectureSources,
    updateLectureSourceStatus
} from "../services/sourceManagementService";
import "./SourceManagement.css";

const SOURCE_TYPES = [
    "DIRECT",
    "AUTHORIZED_EXTERNAL",
    "INSTRUCTOR_MIRROR",
    "PMSD_HOSTED",
    "LIVE_SESSION"
];

function SourceManagement() {
    const { lectureId } = useParams();
    const [sources, setSources] = useState([]);
    const [form, setForm] = useState({
        sourceType: "AUTHORIZED_EXTERNAL",
        sourceUrl: "",
        label: "",
        priority: 100,
        requiresAuth: true,
        expiresAt: ""
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [checking, setChecking] = useState({});
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadSources = async () => {
        try {
            setError("");
            const data = await getLectureSources(lectureId);
            setSources(data.sources || []);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load lecture sources.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            try {
                const data = await getLectureSources(lectureId);
                if (cancelled) return;
                setSources(data.sources || []);
                setError("");
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message || "Unable to load lecture sources.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [lectureId]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setNotice("");

        try {
            await createLectureSource(lectureId, {
                ...form,
                priority: Number(form.priority),
                expiresAt: form.expiresAt || null
            });
            setForm({
                sourceType: "AUTHORIZED_EXTERNAL",
                sourceUrl: "",
                label: "",
                priority: 100,
                requiresAuth: true,
                expiresAt: ""
            });
            setNotice("Lecture source added successfully.");
            await loadSources();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to add lecture source.");
        } finally {
            setSaving(false);
        }
    };

    const disableSource = async (sourceId) => {
        try {
            setError("");
            await deactivateLectureSource(sourceId);
            setNotice("Source disabled.");
            await loadSources();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to disable source.");
        }
    };

    const setStatus = async (sourceId, status) => {
        try {
            setError("");
            await updateLectureSourceStatus(sourceId, status);
            setNotice(`Source status changed to ${status}.`);
            await loadSources();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to update source status.");
        }
    };

    const checkHealth = async (sourceId) => {
        setChecking((current) => ({ ...current, [sourceId]: true }));
        setError("");
        setNotice("");

        try {
            const result = await checkLectureSourceHealth(sourceId);
            const health = result.health;
            setNotice(`Health check: ${health.status}${health.httpStatus ? ` (${health.httpStatus})` : ""}.`);
            await loadSources();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to check source health.");
        } finally {
            setChecking((current) => ({ ...current, [sourceId]: false }));
        }
    };

    return (
        <main className="source-management-page">
            <header className="source-header">
                <div>
                    <span className="eyebrow">CONTENT OPERATIONS</span>
                    <h1>Lecture Sources</h1>
                    <p>Manage the approved destinations used by PMSD's lecture access engine.</p>
                </div>
            </header>

            {error && <div className="source-alert error">{error}</div>}
            {notice && <div className="source-alert success">{notice}</div>}

            <div className="source-grid">
                <section className="source-panel">
                    <div className="panel-title">
                        <FiPlus />
                        <div>
                            <h2>Add source</h2>
                            <p>Add an authorized lecture destination.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="source-form">
                        <label>Source type
                            <select value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })}>
                                {SOURCE_TYPES.map((type) => <option key={type}>{type}</option>)}
                            </select>
                        </label>

                        <label>Label
                            <input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Primary lecture source" />
                        </label>

                        <label>Source URL
                            <input required type="url" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://authorized.example/..." />
                        </label>

                        <div className="form-row">
                            <label>Priority
                                <input type="number" min="0" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
                            </label>
                            <label>Expires at
                                <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
                            </label>
                        </div>

                        <label className="checkbox-row">
                            <input type="checkbox" checked={form.requiresAuth} onChange={(e) => setForm({ ...form, requiresAuth: e.target.checked })} />
                            Requires institutional authentication
                        </label>

                        <button className="primary-button" disabled={saving}>
                            {saving ? "Adding..." : "Add approved source"}
                        </button>
                    </form>
                </section>

                <section className="source-panel">
                    <div className="panel-title">
                        <FiCheckCircle />
                        <div>
                            <h2>Configured sources</h2>
                            <p>{sources.length} source{sources.length === 1 ? "" : "s"} configured.</p>
                        </div>
                    </div>

                    {loading ? <p>Loading sources...</p> : (
                        <div className="source-list">
                            {!sources.length && <p className="empty-state">No sources configured for this lecture.</p>}
                            {sources.map((source) => (
                                <article className="source-item" key={source.id}>
                                    <div className="source-item-main">
                                        <div className="source-item-title">
                                            <h3>{source.label}</h3>
                                            <span className={`status status-${String(source.status || "UNKNOWN").toLowerCase()}`}>{source.status}</span>
                                        </div>
                                        <p>{source.source_type} · Priority {source.priority}</p>
                                        <small>
                                            {source.requires_auth ? "Institutional authentication required" : "No source authentication flag"}
                                            {source.last_checked_at ? ` · Checked ${new Date(source.last_checked_at).toLocaleString()}` : " · Not checked yet"}
                                        </small>
                                    </div>
                                    <div className="source-actions">
                                        {source.is_active && (
                                            <button onClick={() => checkHealth(source.id)} disabled={checking[source.id]} title="Check source health">
                                                <FiActivity /> {checking[source.id] ? "Checking" : "Health"}
                                            </button>
                                        )}
                                        {source.status !== "AVAILABLE" && source.is_active && (
                                            <button onClick={() => setStatus(source.id, "AVAILABLE")} title="Mark available"><FiCheckCircle /></button>
                                        )}
                                        {source.is_active && (
                                            <button onClick={() => setStatus(source.id, "TEMPORARILY_UNAVAILABLE")} title="Mark unavailable"><FiSlash /></button>
                                        )}
                                        {source.is_active && (
                                            <button onClick={() => disableSource(source.id)} title="Disable source"><FiTrash2 /></button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

export default SourceManagement;
