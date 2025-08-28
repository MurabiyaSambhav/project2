// src/api.js
import axios from "axios";

const api = axios.create({
    baseURL: "/api",
});

// attach token automatically
api.interceptors.request.use((config) => {
    const tokens = JSON.parse(localStorage.getItem("authTokens") || "null");
    if (tokens?.access) {
        config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
});

export default api;
