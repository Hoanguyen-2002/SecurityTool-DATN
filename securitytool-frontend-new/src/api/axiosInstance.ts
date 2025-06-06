import axios from 'axios';
import { refreshToken as refreshTokenApi } from './authApi';

const instance = axios.create({ baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081/api' });

// Add a request interceptor to include the auth token
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

instance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 403 && !originalRequest._retry) {
      // Remove expired accessToken immediately
      localStorage.removeItem('authToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = 'Bearer ' + String(token);
              return instance(originalRequest);
            })
            .catch(err => Promise.reject(err));
        }
        originalRequest._retry = true;
        isRefreshing = true;
        try {
          const res = await refreshTokenApi(refreshToken);
          const newAccessToken = res.data.accessToken;
          localStorage.setItem('authToken', newAccessToken);
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = 'Bearer ' + newAccessToken;
          return instance(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken'); // Always remove refreshToken if refresh fails
          localStorage.setItem('forceLogoutMsg', 'Your session has expired. Please log in again.');
          // Dispatch a custom event to notify the app to show a session expired popup
          window.dispatchEvent(new CustomEvent('sessionExpired'));
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default instance;