import apiClient from "./apiClient";

export const getModuleLectures = async (moduleId) => {
    const { data } = await apiClient.get(`/modules/${moduleId}/lectures`);
    return data;
};

export const getLecture = async (lectureId) => {
    const { data } = await apiClient.get(`/lectures/${lectureId}`);
    return data;
};

export const requestLectureAccess = async (lectureId) => {
    const { data } = await apiClient.post(`/access/lectures/${lectureId}/access`);
    return data;
};

export default apiClient;
