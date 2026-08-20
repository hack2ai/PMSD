import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCourseLectures, getLectureAccess, saveLectureProgress } from "../services/restrictedApi";
import "./RestrictedLearning.css";

function LecturePlayer() {
    const { lectureId } = useParams();
    const videoRef = useRef(null);
    const progressTimerRef = useRef(null);
    const [data, setData] = useState(null);
    const [courseLectures, setCourseLectures] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        setData(null);

        getLectureAccess(lectureId)
            .then(async (response) => {
                if (!active) return;
                setData(response.data);
                const courseId = response.data.lecture?.courseId;
                if (courseId) {
                    const lecturesResponse = await getCourseLectures(courseId);
                    if (active) setCourseLectures(lecturesResponse.data.lectures || []);
                }
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
        if (position > 0 && position < Number(data.lecture.durationSeconds || Infinity)) {
            videoRef.current.currentTime = position;
        }
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
            // Progress persistence should never interrupt playback.
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return undefined;

        const onPause = () => persistProgress(false);
        const onEnded = () => persistProgress(true);
        const onPlay = () => {
            window.clearInterval(progressTimerRef.current);
            progressTimerRef.current = window.setInterval(() => persistProgress(false), 15000);
        };
        const onStop = () => {
            window.clearInterval(progressTimerRef.current);
            progressTimerRef.current = null;
        };

        video.addEventListener("pause", onPause);
        video.addEventListener("ended", onEnded);
        video.addEventListener("play", onPlay);
        video.addEventListener("pause", onStop);
        video.addEventListener("ended", onStop);

        return () => {
            window.clearInterval(progressTimerRef.current);
            video.removeEventListener("pause", onPause);
            video.removeEventListener("ended", onEnded);
            video.removeEventListener("play", onPlay);
            video.removeEventListener("pause", onStop);
            video.removeEventListener("ended", onStop);
        };
    }, [lectureId, data]);

    const watermark = useMemo(
        () => data?.watermarkCode ? `PMSD • Authorized • ${data.watermarkCode}` : "PMSD • Authorized learning session",
        [data?.watermarkCode]
    );

    const currentIndex = courseLectures.findIndex((lecture) => Number(lecture.id) === Number(lectureId));
    const previousLecture = currentIndex > 0 ? courseLectures[currentIndex - 1] : null;
    const nextLecture = currentIndex >= 0 && currentIndex < courseLectures.length - 1 ? courseLectures[currentIndex + 1] : null;
    const completion = data?.progress?.completed ? "Completed" : data?.progress ? "Resume available" : "Not started";

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
                        <div className="unsupported-player">This lecture format is not yet supported by the web player.</div>
                    )}
                    <div className="watermark" aria-hidden="true">{watermark}</div>
                </div>
                <div className="player-footer">
                    <span>{completion} · Resume is saved automatically.</span>
                    <span>Session {data.sessionId.slice(0, 8)}…</span>
                </div>
            </section>

            <nav className="lecture-navigation" aria-label="Lecture navigation">
                {previousLecture ? (
                    <Link className="lecture-nav-card" to={`/lectures/${previousLecture.id}`}>
                        <span>← Previous lecture</span>
                        <strong>{previousLecture.title}</strong>
                    </Link>
                ) : <div />}
                {nextLecture ? (
                    <Link className="lecture-nav-card next" to={`/lectures/${nextLecture.id}`}>
                        <span>Next lecture →</span>
                        <strong>{nextLecture.title}</strong>
                    </Link>
                ) : (
                    <Link className="lecture-nav-card next" to={`/courses/${data.lecture.courseId}/learn`}>
                        <span>Course complete →</span>
                        <strong>Back to course outline</strong>
                    </Link>
                )}
            </nav>
        </main>
    );
}

export default LecturePlayer;
