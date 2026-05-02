import axios from 'axios';
import { getToken, clearToken } from '@/lib/auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: false,
});

const AUTH_ENDPOINTS = ['/validateUserCredentials', '/storeUserCredentials'];

// Inject user_token into every request body, except auth endpoints
api.interceptors.request.use((config) => {
  const url = config.url ?? '';
  if (AUTH_ENDPOINTS.some((e) => url.includes(e))) return config;

  const token = getToken();
  if (token) {
    config.data = { ...(typeof config.data === 'object' ? config.data : {}), user_token: token };
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
