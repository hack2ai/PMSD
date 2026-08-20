import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getLectureAccess, saveLectureProgress } from "../services/restrictedApi";
import "./RestrictedLearning.css";

function LecturePlayer() {
    const { lectureId } = useParams();
    const videoRef = useRef(null);
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
                if (active) setError(err.response?.data?.message || "Unable to open this lecture.");
            })
            .finally(() => active && setLoading(false));

        return () => { active = false; };
    }, [lectureId]);

    useEffect(() => {
        if (!data?.progress || !videoRef.current) return;
        const position = Number(data.progress.last_position_seconds || 0);
        if (position > 0) videoRef.current.currentTime = position;
    }, [data]);

    const persistProgress = async (completed = false) => {
        const video = videoRef.current;
        if (!video) return;
        try {
            await saveLectureProgress(lectureId, {
                watchedSeconds: Math.floor(video.currentTime),
                lastPositionSeconds: Math.floor(video.currentTime),
                completed,
            });
        } catch {
            // Progress persistence should not interrupt playback.
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return undefined;
        const onPause = () => persistProgress(false);
        const onEnded = () => persistProgress(true);
        video.addEventListener("pause", onPause);
        video.addEventListener("ended", onEnded);
        return () => {
            video.removeEventListener("pause", onPause);
            video.removeEventListener("ended", onEnded);
        };
    });

    const watermark = useMemo(
        () => data?.watermarkCode ? `PMSD • Authorized • ${data.watermarkCode}` : "PMSD • Authorized learning session",
        [data?.watermarkCode]
    );

    const completion = data?.progress?.completed ? "Completed" : "In progress";

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
                            ref={videoRef}
                            controls
                            controlsList="nodownload"
                            disablePictureInPicture
                            playsInline
                            onContextMenu={(event) => event.preventDefault()}
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
                    <span>{completion} · Resume is saved automatically.</span>
                    <span>Session {data.sessionId.slice(0, 8)}…</span>
                </div>
            </section>
        </main>
    );
}

export default LecturePlayer;
