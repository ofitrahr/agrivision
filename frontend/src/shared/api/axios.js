import axios from 'axios';
import { clearSession, redirectToLogin } from '../utils/token';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    withCredentials: true,
    headers: {
        "Content-Type": 'application/json',
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401 && !error.config?.skipAuthRedirect) {
            clearSession();
            redirectToLogin();
        }
        return Promise.reject(error);
    }
);

export default api;