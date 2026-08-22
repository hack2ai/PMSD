import { Navigate, useLocation } from "react-router-dom";

const getStoredUser = () => {
    try {
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

function RoleGuard({ allowedRoles = [], children }) {
    const location = useLocation();
    const token = localStorage.getItem("token");
    const user = getStoredUser();

    if (!token) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    if (allowedRoles.length && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default RoleGuard;
