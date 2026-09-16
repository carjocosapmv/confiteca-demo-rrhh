import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Use relative URLs so requests go through the Vite dev proxy
// This ensures cookies/CSRF tokens are shared correctly between frontend and backend
const API_URL = '';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor: ensure CSRF cookie is present
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (config.method !== 'get' && config.method !== 'head') {
    // Ensure CSRF cookie is present before state-changing requests
    try {
      await api.get('/sanctum/csrf-cookie');
    } catch {
      // CSRF cookie request failed, continue anyway
    }
  }
  return config;
});

// Response interceptor: handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/auth')) {
          window.location.href = '/auth';
        }
      }

      if (status === 422 && data?.errors) {
        return Promise.reject({
          message: data.message || 'Validation failed',
          errors: data.errors,
          status,
        });
      }

      return Promise.reject({
        message: data?.message || 'An error occurred',
        status,
      });
    }

    return Promise.reject({
      message: 'Network error. Check your connection.',
      status: 0,
    });
  }
);

export default api;

// Convenience methods
export const get = <T>(url: string, params?: object) => api.get<T>(url, { params });
export const post = <T>(url: string, data?: object) => api.post<T>(url, data);
export const put = <T>(url: string, data?: object) => api.put<T>(url, data);
export const patch = <T>(url: string, data?: object) => api.patch<T>(url, data);
export const del = <T>(url: string) => api.delete<T>(url);
