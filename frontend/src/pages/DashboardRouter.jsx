import { Navigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import Dashboard from "./Dashboard";

const getStoredUser = () => {
    try {
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

function DashboardRouter() {
    const token = localStorage.getItem("token");
    const user = getStoredUser();

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (user?.role === "admin") {
        return <AdminDashboard />;
    }

    return <Dashboard />;
}

export default DashboardRouter;
