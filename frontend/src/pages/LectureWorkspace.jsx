import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { FiArrowLeft, FiBookOpen, FiCheckCircle, FiExternalLink, FiLoader, FiLock } from "react-icons/fi";
import { getLecture, requestLectureAccess } from "../services/lectureAccessService";
import { getLectureProgress, saveLectureProgress } from "../services/progressService";
import "./LectureWorkspace.css";

function LectureWorkspace() {
    const { lectureId } = useParams();
    const [lecture, setLecture] = useState(null);
    const [access, setAccess] = useState(null);
    const [progress, setProgress] = useState({ progress_seconds: 0, completed: false });
    const [loading, setLoading] = useState(true);
    const [accessLoading, setAccessLoading] = useState(false);
    const [progressSaving, setProgressSaving] = useState(false);
    const [error, setError] = useState("");
    const saveTimer = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError("");
                const [lectureResponse, progressResponse] = await Promise.all([
                    getLecture(lectureId),
                    getLectureProgress(lectureId)
                ]);
                setLecture(lectureResponse.lecture);
                setProgress(progressResponse.progress);
            } catch (err) {
                setError(err.response?.data?.message || "Unable to load this lecture.");
            } finally {
                setLoading(false);
            }
        };

        if (lectureId) load();
        return () => clearTimeout(saveTimer.current);
    }, [lectureId]);

    const persistProgress = async (seconds, completed = progress.completed) => {
        try {
            setProgressSaving(true);
            const response = await saveLectureProgress(lectureId, seconds, completed);
            setProgress(response.progress);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to save lecture progress.");
        } finally {
            setProgressSaving(false);
        }
    };

    const handleProgressChange = (event) => {
        const seconds = Math.max(0, Number(event.target.value) || 0);
        setProgress((current) => ({ ...current, progress_seconds: seconds }));
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => persistProgress(seconds), 600);
    };

    const handleComplete = async () => {
        await persistProgress(progress.progress_seconds, true);
    };

    const handleAccess = async () => {
        try {
            setAccessLoading(true);
            setError("");
            const response = await requestLectureAccess(lectureId);
            setAccess(response);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to resolve lecture access.");
        } finally {
            setAccessLoading(false);
        }
    };

    if (loading) {
        return <div className="lecture-state"><FiLoader className="spin" /> Loading lecture...</div>;
    }

    if (error && !lecture) {
        return <div className="lecture-state error-state">{error}</div>;
    }

    const duration = Number(lecture?.duration_seconds) || 0;
    const percent = duration ? Math.min(100, Math.round((progress.progress_seconds / duration) * 100)) : 0;

    return (
        <main className="lecture-workspace">
            <header className="lecture-header">
                <button className="back-button" onClick={() => window.history.back()}>
                    <FiArrowLeft /> Back
                </button>
                <div className="lecture-breadcrumb"><FiBookOpen /> Learning Workspace</div>
            </header>

            <section className="lecture-grid">
                <article className="lecture-card">
                    <div className="lecture-hero">
                        <span className="lecture-type">{lecture?.lecture_type || "LECTURE"}</span>
                        <h1>{lecture?.title}</h1>
                        <p>{lecture?.description || "Continue your learning journey with this lecture."}</p>
                    </div>

                    <div className="lecture-content-placeholder">
                        <FiBookOpen size={34} />
                        <h2>Lecture content</h2>
                        <p>Access is resolved securely through PMSD before the approved lecture destination is opened.</p>
                    </div>

                    <div className="progress-card">
                        <div className="progress-heading">
                            <strong>{progress.completed ? "Lecture completed" : "Your progress"}</strong>
                            <span>{progressSaving ? "Saving…" : `${percent}%`}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={Math.max(duration, progress.progress_seconds, 1)}
                            value={progress.progress_seconds}
                            onChange={handleProgressChange}
                            aria-label="Lecture progress"
                        />
                        <div className="progress-actions">
                            <span>Resume: {Math.floor(progress.progress_seconds / 60)} min</span>
                            <button onClick={handleComplete} disabled={progress.completed || progressSaving}>
                                <FiCheckCircle /> {progress.completed ? "Completed" : "Mark complete"}
                            </button>
                        </div>
                    </div>
                </article>

                <aside className="access-panel">
                    <div className="panel-icon"><FiLock /></div>
                    <h2>Lecture Access</h2>
                    <p className="panel-description">PMSD checks enrollment and approved lecture sources before granting access.</p>

                    {error && <div className="access-error">{error}</div>}

                    {!access ? (
                        <button className="access-button" onClick={handleAccess} disabled={accessLoading}>
                            {accessLoading ? <><FiLoader className="spin" /> Checking...</> : "Check Access"}
                        </button>
                    ) : (
                        <div className="access-result">
                            <FiCheckCircle className="success-icon" />
                            <strong>{access.success ? "Access evaluated" : "Access unavailable"}</strong>
                            <span>{access.code || access.message || "See the access result below."}</span>
                            {access.source?.url && (
                                <a href={access.source.url} target="_blank" rel="noreferrer" className="open-lecture">
                                    Open Lecture <FiExternalLink />
                                </a>
                            )}
                        </div>
                    )}
                </aside>
            </section>
        </main>
    );
}

export default LectureWorkspace;
