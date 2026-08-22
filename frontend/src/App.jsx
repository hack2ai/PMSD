import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MyCourses from "./pages/MyCourses";
import LectureWorkspace from "./pages/LectureWorkspace";
import SourceManagement from "./pages/SourceManagement";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-courses" element={<MyCourses />} />
                <Route path="/lectures/:lectureId" element={<LectureWorkspace />} />
                <Route path="/lectures/:lectureId/sources" element={<SourceManagement />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
