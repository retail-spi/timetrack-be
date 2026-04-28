import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { tokenStorage } from '../auth/tokenStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject token
client.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh ou logout si 401
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await tokenStorage.clear();
      // Émettre un événement pour rediriger vers login
    }
    return Promise.reject(error);
  },
);

// API helpers
export const api = {
  auth: {
    login: (email: string, password: string) =>
      client.post('/auth/login', { email, password }).then((r) => r.data),
    refresh: (token: string) =>
      client.post('/auth/refresh', { token }).then((r) => r.data),
  },

  timeEntries: {
    list: () => client.get('/time-entries').then((r) => r.data),
    create: (data: object) => client.post('/time-entries', data).then((r) => r.data),
    update: (id: string, data: object) => client.put(`/time-entries/${id}`, data).then((r) => r.data),
    delete: (id: string) => client.delete(`/time-entries/${id}`),
    approve: (id: string) => client.patch(`/time-entries/${id}/approve`).then((r) => r.data),
    reject: (id: string) => client.patch(`/time-entries/${id}/reject`).then((r) => r.data),
  },

  workerEntries: {
    list: () => client.get('/worker-time-entries').then((r) => r.data),
    create: (data: object) => client.post('/worker-time-entries', data).then((r) => r.data),
    approve: (id: string) => client.patch(`/worker-time-entries/${id}/approve`).then((r) => r.data),
  },

  corrections: {
    list: () => client.get('/corrections').then((r) => r.data),
    create: (data: object) => client.post('/corrections', data).then((r) => r.data),
    approve: (id: string) => client.patch(`/corrections/${id}/approve`).then((r) => r.data),
    reject: (id: string) => client.patch(`/corrections/${id}/reject`).then((r) => r.data),
  },

  activityTypes: {
    list: () => client.get('/activity-types').then((r) => r.data),
  },

  taskTypes: {
    list: () => client.get('/task-types').then((r) => r.data),
  },

  projects: {
    list: () => client.get('/projects').then((r) => r.data),
  },

  alerts: {
    list: () => client.get('/alerts').then((r) => r.data),
    markRead: (id: string) => client.patch(`/alerts/${id}/read`),
  },
};

export default client;
