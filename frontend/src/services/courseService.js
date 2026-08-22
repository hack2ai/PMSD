import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const getMyCourses = async () => {
    const { data } = await api.get("/dashboard/my-courses");
    return data;
};

export const getCourseModules = async (courseId) => {
    const { data } = await api.get(`/courses/${courseId}/modules`);
    return data;
};

export default api;
