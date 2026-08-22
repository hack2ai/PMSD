import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const getLectureSources = async (lectureId) => {
    const { data } = await api.get(`/lecture-sources/lectures/${lectureId}/sources`);
    return data;
};

export const createLectureSource = async (lectureId, payload) => {
    const { data } = await api.post(`/lecture-sources/lectures/${lectureId}/sources`, payload);
    return data;
};

export const updateLectureSourceStatus = async (sourceId, status, httpStatus = null) => {
    const { data } = await api.patch(`/lecture-sources/sources/${sourceId}/status`, {
        status,
        httpStatus
    });
    return data;
};

export const deactivateLectureSource = async (sourceId) => {
    const { data } = await api.delete(`/lecture-sources/sources/${sourceId}`);
    return data;
};

export default api;
