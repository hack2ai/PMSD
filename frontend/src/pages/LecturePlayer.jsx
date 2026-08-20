import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getLectureAccess } from "../services/restrictedApi";
import "./RestrictedLearning.css";

function LecturePlayer() {
    const { lectureId } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getLectureAccess(lectureId)
            .then((response) => {
                if (active) setData(response.data);
            })
            .catch((err) => {
                if (active) {
                    setError(err.response?.data?.message || "Unable to open this lecture.");
                }
            })
            .finally(() => active && setLoading(false));

        return () => { active = false; };
    }, [lectureId]);

    const watermark = useMemo(() => {
        const session = data?.sessionId || "";
        return `PMSD • Authorized Session • ${session.slice(0, 8)}`;
    }, [data?.sessionId]);

    if (loading) return <div className="learning-state">Checking lecture access…</div>;
    if (error) return <div className="learning-state learning-error">{error}</div>;
    if (!data) return null;

    return (
        <main className="player-page">
            <header className="player-header">
                <div>
                    <span className="eyebrow">{data.lecture.moduleTitle}</span>
                    <h1>{data.lecture.title}</h1>
                    <p>{data.lecture.description || "Private course lecture"}</p>
                </div>
                <div className="security-pill">🔒 Protected lecture</div>
            </header>

            <section className="player-card">
                <div className="video-shell">
                    {data.lecture.contentType === "video" ? (
                        <video
                            controls
                            controlsList="nodownload"
                            disablePictureInPicture
                            playsInline
                            src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api"}${data.streamUrl}`}
                        />
                    ) : (
                        <div className="unsupported-player">
                            This lecture format is not yet supported by the web player.
                        </div>
                    )}
                    <div className="watermark" aria-hidden="true">{watermark}</div>
                </div>
                <div className="player-footer">
                    <span>Access is tied to your PMSD account and learning session.</span>
                    <span>Session {data.sessionId.slice(0, 8)}…</span>
                </div>
            </section>
        </main>
    );
}

export default LecturePlayer;
