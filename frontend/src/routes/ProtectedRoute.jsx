import { Navigate, Outlet } from "react-router-dom";

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

export function ProtectedRoute() {
    return localStorage.getItem("token") ? <Outlet /> : <Navigate to="/" replace />;
}

export function AdminRoute() {
    const user = getUser();
    if (!localStorage.getItem("token")) return <Navigate to="/" replace />;
    if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
    return <Outlet />;
}
