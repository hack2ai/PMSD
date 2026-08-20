import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MyCourses from "./pages/MyCourses";
import CourseLearning from "./pages/CourseLearning";
import LecturePlayer from "./pages/LecturePlayer";
import AdminLectures from "./pages/AdminLectures";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-courses" element={<MyCourses />} />
                <Route path="/courses/:courseId/learn" element={<CourseLearning />} />
                <Route path="/lectures/:lectureId" element={<LecturePlayer />} />
                <Route path="/admin/lectures" element={<AdminLectures />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
