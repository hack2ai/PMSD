import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardRouter from "./pages/DashboardRouter";
import MyCourses from "./pages/MyCourses";
import LectureWorkspace from "./pages/LectureWorkspace";
import SourceManagement from "./pages/SourceManagement";
import SecurityAudit from "./pages/SecurityAudit";
import CourseManagement from "./pages/CourseManagement";
import RoleGuard from "./auth/RoleGuard";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<DashboardRouter />} />
                <Route path="/my-courses" element={<MyCourses />} />
                <Route path="/lectures/:lectureId" element={<LectureWorkspace />} />
                <Route
                    path="/lectures/:lectureId/sources"
                    element={
                        <RoleGuard allowedRoles={["admin", "instructor"]}>
                            <SourceManagement />
                        </RoleGuard>
                    }
                />
                <Route path="/admin/security-audit" element={<SecurityAudit />} />
                <Route
                    path="/admin/courses"
                    element={
                        <RoleGuard allowedRoles={["admin"]}>
                            <CourseManagement />
                        </RoleGuard>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;