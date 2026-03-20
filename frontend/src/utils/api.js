import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Strip any trailing slash first
API_URL = API_URL.replace(/\/$/, '');

// Ensure /api is exactly at the end
if (!API_URL.endsWith('/api')) {
    API_URL = `${API_URL}/api`;
}

const api = axios.create({
    baseURL: API_URL,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('momentpick_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !window.location.pathname.includes('/admin-login')) {
            localStorage.removeItem('momentpick_token');
            // window.location.href = '/admin-login';
        }
        return Promise.reject(error);
    }
);

export default api;
