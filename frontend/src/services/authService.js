import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" }
});

export const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
};

export const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    return data;
};

export const saveSession = (session) => {
    localStorage.setItem("token", session.token);
    localStorage.setItem("user", JSON.stringify(session.user));
};

export const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

export default api;
