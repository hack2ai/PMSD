import apiClient from "./apiClient";

export const getAuditLogs = async (filters = {}) => {
    const { data } = await apiClient.get("/audit", { params: filters });
    return data;
};

export default apiClient;
