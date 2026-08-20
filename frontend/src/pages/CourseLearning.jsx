import { useEffect, useState } from "react";
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

    const lectureMap = new Map();
    lectures.forEach((lecture) => lectureMap.set(lecture.id, lecture));

    return (
        <main className="learning-page">
            <header className="learning-hero">
                <div>
                    <span className="eyebrow">My learning</span>
                    <h1>Continue your course</h1>
                    <p>Private course lectures are available only to your enrolled PMSD account.</p>
                </div>
                <div className="course-security">
                    <span>🔒</span>
                    Enrollment protected
                </div>
            </header>

            {error && <div className="learning-error">{error}</div>}

            <section className="module-list">
                {modules.map((module) => {
                    const items = lectures
                        .filter((lecture) => lecture.module_id === module.id)
                        .sort((a, b) => a.position - b.position);

                    return (
                        <article className="module-card" key={module.id}>
                            <div className="module-heading">
                                <div>
                                    <span className="module-number">Module {module.position}</span>
                                    <h2>{module.title}</h2>
                                    {module.description && <p>{module.description}</p>}
                                </div>
                                <span className="lecture-count">{items.length} lectures</span>
                            </div>
                            <div className="lecture-list">
                                {items.map((lecture) => (
                                    <Link className="lecture-row" to={`/lectures/${lecture.id}`} key={lecture.id}>
                                        <span className="lecture-index">{lecture.position}</span>
                                        <span className="lecture-copy">
                                            <strong>{lecture.title}</strong>
                                            <small>{lecture.duration_seconds ? `${Math.ceil(lecture.duration_seconds / 60)} min` : "On demand"}</small>
                                        </span>
                                        <span className="lecture-status">{lecture.status === "published" ? "Watch" : "Locked"}</span>
                                    </Link>
                                ))}
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
