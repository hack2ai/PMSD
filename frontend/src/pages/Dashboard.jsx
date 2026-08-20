import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard, getMyCourses } from "../services/restrictedApi";
import "./RestrictedLearning.css";

function formatHours(seconds) {
    const hours = Number(seconds || 0) / 3600;
    return hours >= 1 ? `${hours.toFixed(1)}h` : `${Math.max(1, Math.round(Number(seconds || 0) / 60))}m`;
}

function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [courses, setCourses] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([getDashboard(), getMyCourses()])
            .then(([dashboardResponse, coursesResponse]) => {
                setSummary(dashboardResponse.data.dashboard);
                setCourses(coursesResponse.data.courses || []);
            })
            .catch((err) => setError(err.response?.data?.message || "Unable to load your dashboard."));
    }, []);

    if (error) return <main className="learning-page"><div className="learning-error">{error}</div></main>;
    if (!summary) return <div className="learning-state">Preparing your learning dashboard…</div>;

    const currentCourse = courses.find((course) => course.progress_percent > 0 && course.progress_percent < 100) || courses[0];

    return (
        <main className="learning-page dashboard-page">
            <header className="learning-hero">
                <div>
                    <span className="eyebrow">PMSD learning space</span>
                    <h1>Keep learning.</h1>
                    <p>Your private study dashboard for courses, progress and protected lectures.</p>
                </div>
                <Link className="primary-cta compact" to="/my-courses">View my courses</Link>
            </header>

            <section className="stats-grid">
                <article className="stat-card"><span>Courses</span><strong>{summary.enrolledCourses}</strong><small>Enrolled</small></article>
                <article className="stat-card"><span>Learning</span><strong>{summary.learningPercent}%</strong><small>{summary.completedLectures}/{summary.totalLectures} lectures completed</small></article>
                <article className="stat-card"><span>Watch time</span><strong>{formatHours(summary.watchedSeconds)}</strong><small>Total tracked study time</small></article>
                <article className="stat-card"><span>Certificates</span><strong>{summary.certificates}</strong><small>Earned</small></article>
            </section>

            {currentCourse && (
                <section className="continue-card">
                    <div>
                        <span className="eyebrow">Continue learning</span>
                        <h2>{currentCourse.title}</h2>
                        <p>{currentCourse.progress_percent}% complete · {currentCourse.completed_lectures}/{currentCourse.total_lectures} lectures</p>
                        <div className="progress-track"><div className="progress-fill" style={{ width: `${currentCourse.progress_percent}%` }} /></div>
                    </div>
                    <Link className="primary-cta" to={`/courses/${currentCourse.id}/learn`}>
                        {currentCourse.progress_percent ? "Continue" : "Start"}
                    </Link>
                </section>
            )}

            <section className="recent-section">
                <div className="section-heading"><div><span className="eyebrow">Your library</span><h2>My courses</h2></div><Link to="/my-courses">See all</Link></div>
                <div className="dashboard-course-list">
                    {courses.slice(0, 3).map((course) => (
                        <Link to={`/courses/${course.id}/learn`} className="dashboard-course-row" key={course.id}>
                            <div className="dashboard-course-copy"><strong>{course.title}</strong><span>{course.progress_percent}% complete</span></div>
                            <div className="progress-track compact-track"><div className="progress-fill" style={{ width: `${course.progress_percent}%` }} /></div>
                            <span className="arrow">→</span>
                        </Link>
                    ))}
                    {!courses.length && <div className="empty-state">No courses to show yet.</div>}
                </div>
            </section>
        </main>
    );
}

export default Dashboard;
