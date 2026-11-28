import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../services/apiClient";
import "./CourseManagement.css";

const empty = { title: "", slug: "", instructor: "", description: "", category: "", level: "beginner", price: "0", duration: "" };

function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function CourseManagement() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get("/courses");
            setCourses(data.courses || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load courses.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({
            ...f,
            [name]: value,
            ...(name === "title" && !editing ? { slug: slugify(value) } : {})
        }));
    };

    const openCreate = () => { setEditing(null); setForm(empty); setShowForm(true); setError(""); setSuccess(""); };
    const openEdit = (c) => {
        setEditing(c.id);
        setForm({
            title: c.title || "",
            slug: c.slug || "",
            instructor: c.instructor || "",
            description: c.description || "",
            category: c.category || "",
            level: c.level || "beginner",
            price: c.price ?? "0",
            duration: c.duration || ""
        });
        setShowForm(true);
        setError("");
        setSuccess("");
    };
    const cancel = () => { setShowForm(false); setEditing(null); setForm(empty); };

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            if (editing) {
                await apiClient.put(`/courses/${editing}`, form);
                setSuccess("Course updated.");
            } else {
                await apiClient.post("/courses", form);
                setSuccess("Course created.");
            }
            setShowForm(false);
            setEditing(null);
            setForm(empty);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Save failed.");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Delete this course? This cannot be undone.")) return;
        setDeleting(id);
        try {
            await apiClient.delete(`/courses/${id}`);
            setSuccess("Course deleted.");
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Delete failed.");
        } finally {
            setDeleting(null);
        }
    };

    return (
        <main className="cm-page">
            <header className="cm-header">
                <div>
                    <span className="eyebrow">ADMIN · CONTENT</span>
                    <h1>Course Management</h1>
                    <p>Create, edit, and delete courses on the PMSD platform.</p>
                </div>
                <div className="cm-header-actions">
                    <Link to="/dashboard" className="cm-btn cm-btn-ghost">← Dashboard</Link>
                    <button className="cm-btn cm-btn-primary" onClick={openCreate}>+ New course</button>
                </div>
            </header>

            {error && <div className="cm-alert cm-alert-error">{error}</div>}
            {success && <div className="cm-alert cm-alert-success">{success}</div>}

            {showForm && (
                <div className="cm-form-wrap">
                    <form className="cm-form" onSubmit={save}>
                        <h2>{editing ? "Edit course" : "Create course"}</h2>
                        <div className="cm-form-grid">
                            <label>Title *<input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Introduction to Python" /></label>
                            <label>Slug *<input name="slug" value={form.slug} onChange={handleChange} required placeholder="e.g. intro-to-python" /></label>
                            <label>Instructor *<input name="instructor" value={form.instructor} onChange={handleChange} required placeholder="e.g. John Smith" /></label>
                            <label>Category<input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Programming" /></label>
                            <label>Level<select name="level" value={form.level} onChange={handleChange}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
                            <label>Price<input name="price" type="number" min="0" value={form.price} onChange={handleChange} /></label>
                            <label>Duration<input name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 8 hours" /></label>
                            <label className="cm-full">Description<textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Course description..." /></label>
                        </div>
                        <div className="cm-form-actions">
                            <button type="button" className="cm-btn cm-btn-ghost" onClick={cancel}>Cancel</button>
                            <button type="submit" className="cm-btn cm-btn-primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create course"}</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="cm-state">Loading courses…</div>
            ) : !courses.length ? (
                <div className="cm-state">No courses yet. Click "New course" to create one.</div>
            ) : (
                <div className="cm-table-wrap">
                    <table className="cm-table">
                        <thead><tr><th>Title</th><th>Instructor</th><th>Level</th><th>Price</th><th>Category</th><th>Actions</th></tr></thead>
                        <tbody>
                            {courses.map((c) => (
                                <tr key={c.id}>
                                    <td><strong>{c.title}</strong><br /><span className="cm-slug">{c.slug}</span></td>
                                    <td>{c.instructor}</td>
                                    <td><span className={`cm-badge cm-badge-${c.level || "beginner"}`}>{c.level || "beginner"}</span></td>
                                    <td>{c.price > 0 ? `₹${c.price}` : "Free"}</td>
                                    <td>{c.category || "—"}</td>
                                    <td className="cm-actions">
                                        <button className="cm-btn cm-btn-sm" onClick={() => openEdit(c)}>Edit</button>
                                        <button className="cm-btn cm-btn-sm cm-btn-danger" onClick={() => remove(c.id)} disabled={deleting === c.id}>{deleting === c.id ? "…" : "Delete"}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

export default CourseManagement;