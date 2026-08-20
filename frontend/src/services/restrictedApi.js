import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
const client = axios.create({ baseURL: API_BASE, timeout: 15000 });

client.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const getCourseModules = (courseId) => client.get(`/lectures/course/${courseId}/modules`);
export const getCourseLectures = (courseId) => client.get(`/lectures/course/${courseId}`);
export const getLectureAccess = (lectureId) => client.get(`/lectures/${lectureId}/access`);
export const saveLectureProgress = (lectureId, payload) => client.post(`/lectures/${lectureId}/progress`, payload);
export const createModule = (courseId, payload) => client.post(`/lectures/course/${courseId}/modules`, payload);
export const createLecture = (moduleId, payload) => client.post(`/lectures/modules/${moduleId}/lectures`, payload);
export const importTelegramLecture = (payload) => client.post("/telegram/imports", payload);
export const getTelegramSources = () => client.get("/telegram/sources");
export const createTelegramSource = (payload) => client.post("/telegram/sources", payload);
export const registerTelegramWebhook = (webhookUrl) => client.post("/telegram/webhook/register", { webhookUrl });

export default client;
