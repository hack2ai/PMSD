import { useEffect, useState } from "react";
import { FiArrowRight, FiCheckCircle, FiCircle, FiLoader } from "react-icons/fi";
import { Link } from "react-router-dom";
import { getCourseProgress } from "../services/progressService";

function CourseProgressCard({ course, modules = [] }) {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const response = await getCourseProgress(course.id);
                if (active) setProgress(response.progress || null);
            } catch {
                if (active) setProgress(null);
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [course.id]);

    const lectures = modules.flatMap((module) => module.lectures || []);
    const fallbackTotal = lectures.length;
    const fallbackCompleted = lectures.filter((lecture) => lecture.completed).length;
    const total = progress?.totalLectures ?? fallbackTotal;
    const completed = progress?.completedLectures ?? fallbackCompleted;
    const percentage = progress?.percentage ?? (total ? Math.round((completed / total) * 100) : 0);
    const nextLecture = lectures.find((lecture) => lecture.status === "PUBLISHED" && !lecture.completed) || lectures[0];

    return (
        <div className="course-progress-card">
            <div className="course-progress-heading">
                <div>
                    <span>COURSE PROGRESS</span>
                    <h3>{percentage}% complete</h3>
                </div>
                {loading ? <FiLoader className="spin" /> : <FiCheckCircle />}
            </div>

            <div className="progress-track" aria-label={`Course progress ${percentage}%`}>
                <div className="progress-fill" style={{ width: `${Math.min(100, percentage)}%` }} />
            </div>

            <div className="progress-meta">
                <span>{completed} / {total} lectures completed</span>
                {progress?.watchedSeconds ? <span>{Math.floor(progress.watchedSeconds / 60)} min learned</span> : null}
            </div>

            <div className="course-progress-footer">
                <div className="module-summary">
                    {modules.slice(0, 3).map((module) => (
                        <span key={module.id}>
                            {module.title}
                            {module.lectures?.length ? <FiCircle size={9} /> : <FiCheckCircle size={12} />}
                        </span>
                    ))}
                </div>

                {nextLecture && (
                    <Link to={`/lectures/${nextLecture.id}`} className="continue-link">
                        Continue learning <FiArrowRight />
                    </Link>
                )}
            </div>
        </div>
    );
}

export default CourseProgressCard;
