import apiClient from "./apiClient";

export const getAdminOverview = async () => {
    const { data } = await apiClient.get("/admin/dashboard");
    return data;
};

export default apiClient;
