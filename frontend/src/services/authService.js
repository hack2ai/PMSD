import axios from "axios";

// In production, use the same-origin Vercel /api rewrite so the browser
// never tries to call localhost. A VITE_API_URL can still override this for
// local development or a separately hosted backend.
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

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
