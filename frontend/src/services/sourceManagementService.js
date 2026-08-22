import apiClient from "./apiClient";

export const getLectureSources = async (lectureId) => {
    const { data } = await apiClient.get(`/lecture-sources/lectures/${lectureId}/sources`);
    return data;
};

export const createLectureSource = async (lectureId, payload) => {
    const { data } = await apiClient.post(`/lecture-sources/lectures/${lectureId}/sources`, payload);
    return data;
};

export const updateLectureSourceStatus = async (sourceId, status, httpStatus = null) => {
    const { data } = await apiClient.patch(`/lecture-sources/sources/${sourceId}/status`, {
        status,
        httpStatus
    });
    return data;
};

export const deactivateLectureSource = async (sourceId) => {
    const { data } = await apiClient.delete(`/lecture-sources/sources/${sourceId}`);
    return data;
};

export const checkLectureSourceHealth = async (sourceId) => {
    const { data } = await apiClient.post(`/source-health/sources/${sourceId}/check`);
    return data;
};

export default apiClient;
