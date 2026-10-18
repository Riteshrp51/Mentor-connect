import axios from 'axios';

const api = axios.create({
  baseURL: '', // baseURL is empty because we use the Vite proxy '/api'
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token to headers automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / unauthenticated responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we receive a 401 response and are not on the login page, we can clear token
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Let the calling application handle state changes or redirect
    }
    return Promise.reject(error);
  }
);

export default api;
