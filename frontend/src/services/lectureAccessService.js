import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getModuleLectures = async (moduleId) => {
    const { data } = await api.get(`/modules/${moduleId}/lectures`);
    return data;
};

export const getLecture = async (lectureId) => {
    const { data } = await api.get(`/lectures/${lectureId}`);
    return data;
};

export const requestLectureAccess = async (lectureId) => {
    const { data } = await api.post(`/access/lectures/${lectureId}/access`);
    return data;
};

export default api;
