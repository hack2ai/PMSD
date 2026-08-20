import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyCourses } from "../services/restrictedApi";
import "./RestrictedLearning.css";

function formatMinutes(seconds) {
    return Math.max(1, Math.round(Number(seconds || 0) / 60));
}

function MyCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getMyCourses()
            .then((response) => setCourses(response.data.courses || []))
            .catch((err) => setError(err.response?.data?.message || "Unable to load your courses."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="learning-state">Loading your learning library…</div>;
    if (error) return <main className="learning-page"><div className="learning-error">{error}</div></main>;

    return (
        <main className="learning-page">
            <header className="learning-hero">
                <div>
                    <span className="eyebrow">My learning</span>
                    <h1>Your courses</h1>
                    <p>Pick up exactly where you left off. Your progress is saved to your PMSD account.</p>
                </div>
                <div className="course-security"><span>🔒</span> Restricted access</div>
            </header>

            {!courses.length ? (
                <div className="empty-state">You are not enrolled in any courses yet.</div>
            ) : (
                <section className="course-grid">
                    {courses.map((course) => (
                        <article className="course-card" key={course.id}>
                            <div className="course-card-media">
                                {course.thumbnail ? <img src={course.thumbnail} alt="" /> : <div className="course-placeholder">PMSD</div>}
                            </div>
                            <div className="course-card-body">
                                <span className="eyebrow">{course.instructor || "PMSD Course"}</span>
                                <h2>{course.title}</h2>
                                <p>{course.description || "Continue your structured learning journey."}</p>
                                <div className="progress-meta">
                                    <strong>{course.progress_percent}% complete</strong>
                                    <span>{course.completed_lectures}/{course.total_lectures} lectures</span>
                                </div>
                                <div className="progress-track" aria-label={`${course.progress_percent}% complete`}>
                                    <div className="progress-fill" style={{ width: `${course.progress_percent}%` }} />
                                </div>
                                <div className="course-stats">
                                    <span>{formatMinutes(course.watched_seconds)} min watched</span>
                                    <span>Enrolled {new Date(course.enrolled_at).toLocaleDateString()}</span>
                                </div>
                                <Link className="primary-cta" to={`/courses/${course.id}/learn`}>
                                    {course.progress_percent > 0 ? "Continue learning" : "Start course"}
                                </Link>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </main>
    );
}

export default MyCourses;
