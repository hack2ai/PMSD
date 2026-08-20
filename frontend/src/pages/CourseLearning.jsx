import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCourseLectures, getCourseModules } from "../services/restrictedApi";
import "./RestrictedLearning.css";

function CourseLearning() {
    const { courseId } = useParams();
    const [modules, setModules] = useState([]);
    const [lectures, setLectures] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([getCourseModules(courseId), getCourseLectures(courseId)])
            .then(([moduleResponse, lectureResponse]) => {
                setModules(moduleResponse.data.modules || []);
                setLectures(lectureResponse.data.lectures || []);
            })
            .catch((err) => setError(err.response?.data?.message || "Unable to load course lectures."));
    }, [courseId]);

    const overall = useMemo(() => {
        const total = lectures.length;
        const completed = lectures.filter((lecture) => lecture.completed).length;
        return {
            total,
            completed,
            percent: total ? Math.round((completed / total) * 100) : 0
        };
    }, [lectures]);

    return (
        <main className="learning-page">
            <header className="learning-hero">
                <div>
                    <span className="eyebrow">Private course</span>
                    <h1>Continue your course</h1>
                    <p>Each lecture is delivered through PMSD with account-bound access and saved progress.</p>
                </div>
                <div className="course-security"><span>🔒</span> Enrollment protected</div>
            </header>

            <section className="course-progress-card">
                <div>
                    <span className="eyebrow">Course progress</span>
                    <strong>{overall.percent}% complete</strong>
                    <span>{overall.completed} of {overall.total} lectures completed</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${overall.percent}%` }} /></div>
            </section>

            {error && <div className="learning-error">{error}</div>}

            <section className="module-list">
                {modules.map((module) => {
                    const items = lectures
                        .filter((lecture) => lecture.module_id === module.id)
                        .sort((a, b) => a.position - b.position);
                    const completed = items.filter((lecture) => lecture.completed).length;

                    return (
                        <article className="module-card" key={module.id}>
                            <div className="module-heading">
                                <div>
                                    <span className="module-number">Module {module.position}</span>
                                    <h2>{module.title}</h2>
                                    {module.description && <p>{module.description}</p>}
                                </div>
                                <span className="lecture-count">{completed}/{items.length} complete</span>
                            </div>
                            <div className="lecture-list">
                                {items.map((lecture) => {
                                    const progress = lecture.duration_seconds
                                        ? Math.min(100, Math.round((lecture.last_position_seconds / lecture.duration_seconds) * 100))
                                        : 0;
                                    return (
                                        <Link className="lecture-row" to={`/lectures/${lecture.id}`} key={lecture.id}>
                                            <span className={`lecture-check ${lecture.completed ? "done" : ""}`}>{lecture.completed ? "✓" : lecture.position}</span>
                                            <span className="lecture-copy">
                                                <strong>{lecture.title}</strong>
                                                <small>{lecture.duration_seconds ? `${Math.ceil(lecture.duration_seconds / 60)} min` : "On demand"}{progress > 0 && !lecture.completed ? ` · ${progress}% watched` : ""}</small>
                                                {!lecture.completed && progress > 0 && <span className="mini-progress"><span style={{ width: `${progress}%` }} /></span>}
                                            </span>
                                            <span className="lecture-status">{lecture.completed ? "Completed" : progress ? "Continue" : "Watch"} →</span>
                                        </Link>
                                    );
                                })}
                                {!items.length && <div className="empty-state">No lectures published in this module yet.</div>}
                            </div>
                        </article>
                    );
                })}
                {!modules.length && !error && <div className="empty-state">No course modules available yet.</div>}
            </section>
        </main>
    );
}

export default CourseLearning;
