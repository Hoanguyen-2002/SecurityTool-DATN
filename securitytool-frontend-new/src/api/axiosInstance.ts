import axios from 'axios';

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

export default instance;