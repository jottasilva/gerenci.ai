import axios from 'axios';

// Using relative path to utilize Vite's proxy in dev, and NGINX config in prod.
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
    baseURL: API_URL,
});

// Attach JWT token, X-Store-ID header, and dynamic Content-Type on every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Admins: attach selected store ID so backend filters by that store
    const selectedStoreId = localStorage.getItem('selected_store_id');
    if (selectedStoreId) {
        config.headers['X-Store-ID'] = selectedStoreId;
    }

    // Dynamic Content-Type: let browser handle FormData (multipart), default to JSON
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
    }

    return config;
});

export const sleep = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));
