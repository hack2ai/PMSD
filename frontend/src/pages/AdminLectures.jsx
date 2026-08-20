import { useEffect, useState } from "react";
import {
    importTelegramLecture,
    createLecture,
    createModule,
    getCourseModules,
    getTelegramSources,
    createTelegramSource,
    registerTelegramWebhook
} from "../services/restrictedApi";

function AdminLectures() {
    const [courseId, setCourseId] = useState("");
    const [moduleId, setModuleId] = useState("");
    const [modules, setModules] = useState([]);
    const [sources, setSources] = useState([]);
    const [moduleForm, setModuleForm] = useState({ title: "", description: "", position: 1 });
    const [sourceForm, setSourceForm] = useState({ label: "", chatId: "", chatUsername: "", defaultModuleId: "", autoPublish: false });
    const [webhookUrl, setWebhookUrl] = useState("");
    const [lectureForm, setLectureForm] = useState({
        title: "", description: "", position: 1, contentType: "video", sourceType: "telegram",
        telegramChatId: "", telegramMessageId: "", fileId: "", fileName: "", durationSeconds: "", status: "draft"
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const loadModules = async () => {
        if (!courseId) return setModules([]);
        try {
            const response = await getCourseModules(courseId);
            setModules(response.data.modules || []);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load modules.");
        }
    };

    const loadSources = async () => {
        try {
            const response = await getTelegramSources();
            setSources(response.data.sources || []);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load Telegram sources.");
        }
    };

    useEffect(() => { loadModules(); }, [courseId]);
    useEffect(() => { loadSources(); }, []);

    const onCreateModule = async (event) => {
        event.preventDefault();
        setBusy(true); setError(""); setMessage("");
        try {
            await createModule(courseId, moduleForm);
            setModuleForm({ title: "", description: "", position: modules.length + 1 });
            await loadModules();
            setMessage("Module created.");
        } catch (err) {
            setError(err.response?.data?.message || "Unable to create module.");
        } finally { setBusy(false); }
    };

    const onCreateSource = async (event) => {
        event.preventDefault();
        setBusy(true); setError(""); setMessage("");
        try {
            await createTelegramSource({
                ...sourceForm,
                defaultModuleId: sourceForm.defaultModuleId ? Number(sourceForm.defaultModuleId) : null
            });
            setSourceForm({ label: "", chatId: "", chatUsername: "", defaultModuleId: "", autoPublish: false });
            await loadSources();
            setMessage("Telegram source authorized.");
        } catch (err) {
            setError(err.response?.data?.message || "Unable to create Telegram source.");
        } finally { setBusy(false); }
    };

    const onRegisterWebhook = async (event) => {
        event.preventDefault();
        setBusy(true); setError(""); setMessage("");
        try {
            await registerTelegramWebhook(webhookUrl);
            setMessage("Telegram webhook registered successfully.");
        } catch (err) {
            setError(err.response?.data?.message || "Webhook registration failed.");
        } finally { setBusy(false); }
    };

    const onImport = async (event) => {
        event.preventDefault();
        setBusy(true); setError(""); setMessage("");
        try {
            const response = await importTelegramLecture({
                ...lectureForm,
                moduleId: Number(moduleId),
                position: Number(lectureForm.position),
                durationSeconds: lectureForm.durationSeconds ? Number(lectureForm.durationSeconds) : null
            });
            setMessage(`Lecture imported: ${response.data.lecture?.title || lectureForm.title}`);
            setLectureForm((current) => ({ ...current, title: "", description: "", fileId: "", fileName: "" }));
        } catch (err) {
            setError(err.response?.data?.message || "Telegram import failed.");
        } finally { setBusy(false); }
    };

    return (
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 20px", textAlign: "left" }}>
            <div style={{ marginBottom: 30 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#667085" }}>Admin studio</div>
                <h1 style={{ margin: "8px 0" }}>Lecture management</h1>
                <p style={{ color: "#667085" }}>Connect approved Telegram channels to PMSD, route them into modules, and publish protected lectures to enrolled students.</p>
            </div>

            {error && <div style={{ padding: 14, borderRadius: 12, background: "#fff6f6", color: "#b42318", marginBottom: 14 }}>{error}</div>}
            {message && <div style={{ padding: 14, borderRadius: 12, background: "#f0fdf4", color: "#166534", marginBottom: 14 }}>{message}</div>}

            <section style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", marginBottom: 20 }}>
                <form onSubmit={onCreateModule} style={cardStyle}>
                    <h2>Create module</h2>
                    <label>Course ID<input required value={courseId} onChange={(e) => setCourseId(e.target.value)} /></label>
                    <label>Module title<input required value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} /></label>
                    <label>Description<textarea value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} /></label>
                    <label>Position<input type="number" min="1" value={moduleForm.position} onChange={(e) => setModuleForm({ ...moduleForm, position: Number(e.target.value) })} /></label>
                    <button disabled={busy || !courseId}>Create module</button>
                </form>

                <form onSubmit={onCreateSource} style={cardStyle}>
                    <h2>Authorize Telegram channel</h2>
                    <label>Label<input required value={sourceForm.label} onChange={(e) => setSourceForm({ ...sourceForm, label: e.target.value })} placeholder="DSA Batch Channel" /></label>
                    <label>Telegram chat ID<input required value={sourceForm.chatId} onChange={(e) => setSourceForm({ ...sourceForm, chatId: e.target.value })} placeholder="-1001234567890" /></label>
                    <label>Username<input value={sourceForm.chatUsername} onChange={(e) => setSourceForm({ ...sourceForm, chatUsername: e.target.value })} placeholder="@your_channel" /></label>
                    <label>Default module<select value={sourceForm.defaultModuleId} onChange={(e) => setSourceForm({ ...sourceForm, defaultModuleId: e.target.value })}><option value="">Select module</option>{modules.map((module) => <option key={module.id} value={module.id}>{module.position}. {module.title}</option>)}</select></label>
                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={sourceForm.autoPublish} onChange={(e) => setSourceForm({ ...sourceForm, autoPublish: e.target.checked })} /> Auto-publish imported lectures</label>
                    <button disabled={busy || !sourceForm.defaultModuleId}>Authorize channel</button>
                    {sources.length > 0 && <div style={{ fontSize: 12, color: "#667085" }}>{sources.length} authorized source(s) configured.</div>}
                </form>

                <form onSubmit={onRegisterWebhook} style={cardStyle}>
                    <h2>Register Telegram webhook</h2>
                    <p style={{ margin: 0, color: "#667085", fontSize: 13 }}>Use your public HTTPS PMSD callback URL ending in <code>/api/telegram/webhook</code>.</p>
                    <label>Public webhook URL<input required value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://app.example.com/api/telegram/webhook" /></label>
                    <button disabled={busy}>Register webhook</button>
                </form>
            </section>

            <section>
                <form onSubmit={onImport} style={cardStyle}>
                    <h2>Manual Telegram import</h2>
                    <label>Module<select required value={moduleId} onChange={(e) => setModuleId(e.target.value)}><option value="">Select module</option>{modules.map((module) => <option key={module.id} value={module.id}>{module.position}. {module.title}</option>)}</select></label>
                    <label>Lecture title<input required value={lectureForm.title} onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })} /></label>
                    <label>Description<textarea value={lectureForm.description} onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })} /></label>
                    <label>Telegram file ID<input required value={lectureForm.fileId} onChange={(e) => setLectureForm({ ...lectureForm, fileId: e.target.value })} /></label>
                    <label>Telegram chat ID<input value={lectureForm.telegramChatId} onChange={(e) => setLectureForm({ ...lectureForm, telegramChatId: e.target.value })} /></label>
                    <label>Telegram message ID<input value={lectureForm.telegramMessageId} onChange={(e) => setLectureForm({ ...lectureForm, telegramMessageId: e.target.value })} /></label>
                    <label>Original filename<input value={lectureForm.fileName} onChange={(e) => setLectureForm({ ...lectureForm, fileName: e.target.value })} /></label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <label>Position<input type="number" min="1" value={lectureForm.position} onChange={(e) => setLectureForm({ ...lectureForm, position: Number(e.target.value) })} /></label>
                        <label>Duration (sec)<input type="number" min="0" value={lectureForm.durationSeconds} onChange={(e) => setLectureForm({ ...lectureForm, durationSeconds: e.target.value })} /></label>
                    </div>
                    <label>Status<select value={lectureForm.status} onChange={(e) => setLectureForm({ ...lectureForm, status: e.target.value })}><option value="draft">Draft</option><option value="published">Published</option></select></label>
                    <button disabled={busy || !moduleId}>Import lecture</button>
                </form>
            </section>
        </main>
    );
}

const cardStyle = {
    display: "grid",
    gap: 14,
    padding: 22,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    boxShadow: "0 10px 30px rgba(16,24,40,.05)"
};

export default AdminLectures;
