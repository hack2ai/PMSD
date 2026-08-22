import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const getLectureProgress = async (lectureId) => {
    const { data } = await api.get(`/progress/lectures/${lectureId}`);
    return data;
};

export const saveLectureProgress = async (lectureId, progressSeconds, completed = false) => {
    const { data } = await api.post(`/progress/lectures/${lectureId}`, {
        progress_seconds: Math.max(0, Math.floor(progressSeconds)),
        completed
    });
    return data;
};

export const getCourseProgress = async (courseId) => {
    const { data } = await api.get(`/progress/courses/${courseId}`);
    return data;
};

export default api;
