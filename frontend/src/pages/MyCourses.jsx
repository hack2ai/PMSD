import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyCourses, getCourseModules } from "../services/courseService";
import CourseProgressCard from "../components/CourseProgressCard";
import "./MyCourses.css";

function MyCourses() {
    const [courses, setCourses] = useState([]);
    const [expandedCourse, setExpandedCourse] = useState(null);
    const [modules, setModules] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadCourses = async () => {
            try {
                const data = await getMyCourses();
                setCourses(data.courses || data.data || []);
            } catch (err) {
                setError(err.response?.data?.message || "Unable to load your courses.");
            } finally {
                setLoading(false);
            }
        };
        loadCourses();
    }, []);

    const toggleCourse = async (courseId) => {
        if (expandedCourse === courseId) {
            setExpandedCourse(null);
            return;
        }

        setExpandedCourse(courseId);
        if (modules[courseId]) return;

        try {
            const data = await getCourseModules(courseId);
            setModules((current) => ({
                ...current,
                [courseId]: data.modules || []
            }));
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load course modules.");
        }
    };

    if (loading) {
        return (
            <main className="courses-page">
                <div className="courses-state">Loading your learning workspace...</div>
            </main>
        );
    }

    return (
        <main className="courses-page">
            <header className="courses-header">
                <div>
                    <span className="eyebrow">LEARNING WORKSPACE</span>
                    <h1>My Courses</h1>
                    <p>Continue your enrolled courses and open lectures through PMSD's authorized access system.</p>
                </div>
                <Link className="dashboard-link" to="/dashboard">Dashboard</Link>
            </header>

            {error && <div className="courses-error">{error}</div>}

            {!courses.length ? (
                <section className="courses-state">
                    <h2>No enrolled courses yet</h2>
                    <p>Once you enroll in a course, its modules and lectures will appear here.</p>
                </section>
            ) : (
                <section className="course-list">
                    {courses.map((course) => {
                        const courseModules = modules[course.id] || [];

                        return (
                            <article className="course-card" key={course.id}>
                                <div className="course-card-main">
                                    <div>
                                        <span className="course-label">ENROLLED COURSE</span>
                                        <h2>{course.title || course.name || `Course #${course.id}`}</h2>
                                        <p>{course.description || "Explore the modules and continue learning."}</p>
                                    </div>
                                    <button onClick={() => toggleCourse(course.id)}>
                                        {expandedCourse === course.id ? "Hide modules" : "View modules"}
                                    </button>
                                </div>

                                <CourseProgressCard course={course} modules={courseModules} />

                                {expandedCourse === course.id && (
                                    <div className="module-list">
                                        {courseModules.map((module) => (
                                            <div className="module-row" key={module.id}>
                                                <div>
                                                    <span>MODULE {(module.display_order ?? 0) + 1}</span>
                                                    <h3>{module.title}</h3>
                                                    {module.description && <p>{module.description}</p>}
                                                </div>
                                                <div className="lecture-links">
                                                    {(module.lectures || []).map((lecture) => (
                                                        <Link key={lecture.id} to={`/lectures/${lecture.id}`}>
                                                            {lecture.title}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {!courseModules.length && (
                                            <p className="empty-modules">Open “View modules” after content is published for this course.</p>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </section>
            )}
        </main>
    );
}

export default MyCourses;
