import apiClient from "./apiClient";

export const getMyCourses = async () => {
    const { data } = await apiClient.get("/dashboard/my-courses");
    return data;
};

export const getCourseModules = async (courseId) => {
    const { data } = await apiClient.get(`/courses/${courseId}/modules`);
    return data;
};

export default apiClient;
