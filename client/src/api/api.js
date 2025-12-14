import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const instance = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if(token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default instance;
