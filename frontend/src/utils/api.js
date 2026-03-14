import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (err) {
        console.error('Error parsing user from localStorage', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
         localStorage.removeItem('user');
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
