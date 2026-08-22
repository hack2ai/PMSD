import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FiArrowLeft, FiBookOpen, FiCheckCircle, FiExternalLink, FiLoader, FiLock } from "react-icons/fi";
import { getLecture, requestLectureAccess } from "../services/lectureAccessService";
import "./LectureWorkspace.css";

function LectureWorkspace() {
    const { lectureId } = useParams();
    const [lecture, setLecture] = useState(null);
    const [access, setAccess] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessLoading, setAccessLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadLecture = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await getLecture(lectureId);
                setLecture(response.lecture);
            } catch (err) {
                setError(err.response?.data?.message || "Unable to load this lecture.");
            } finally {
                setLoading(false);
            }
        };

        if (lectureId) loadLecture();
    }, [lectureId]);

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

    return (
        <main className="lecture-workspace">
            <header className="lecture-header">
                <button className="back-button" onClick={() => window.history.back()}>
                    <FiArrowLeft /> Back
                </button>
                <div className="lecture-breadcrumb">
                    <FiBookOpen /> Learning Workspace
                </div>
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
                        <p>Access is resolved securely through PMSD before the lecture destination is opened.</p>
                    </div>
                </article>

                <aside className="access-panel">
                    <div className="panel-icon"><FiLock /></div>
                    <h2>Lecture Access</h2>
                    <p className="panel-description">
                        PMSD checks your enrollment and the approved lecture sources before granting access.
                    </p>

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
