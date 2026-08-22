import { useNavigate } from "react-router-dom";
import { clearSession } from "../services/authService";

function LogoutButton({ className = "" }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        clearSession();
        navigate("/", { replace: true });
    };

    return (
        <button type="button" className={className} onClick={handleLogout}>
            Logout
        </button>
    );
}

export default LogoutButton;
