import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://1e1e-2804-fec-d235-2700-1d57-5694-62c1-16de.ngrok-free.app/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach JWT token and X-Store-ID header on every request
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

    return config;
});

export const sleep = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));
