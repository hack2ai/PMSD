import apiClient from "./apiClient";

export const getLectureProgress = async (lectureId) => {
    const { data } = await apiClient.get(`/progress/lectures/${lectureId}`);
    return data;
};

export const saveLectureProgress = async (lectureId, progressSeconds, completed = false) => {
    const { data } = await apiClient.post(`/progress/lectures/${lectureId}`, {
        progress_seconds: Math.max(0, Math.floor(progressSeconds)),
        completed
    });
    return data;
};

export const getCourseProgress = async (courseId) => {
    const { data } = await apiClient.get(`/progress/courses/${courseId}`);
    return data;
};

export default apiClient;
