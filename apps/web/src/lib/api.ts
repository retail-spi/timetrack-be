import axios from 'axios';

const client = axios.create({
  baseURL: '/api/proxy',
});

if (typeof window !== 'undefined') {
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      return Promise.reject(err);
    },
  );
}

export const webApi = {
  auth: {
    login: (email: string, password: string) =>
      client.post('/auth/login', { email, password }).then((r) => r.data),
  },
  users: {
    list: () => client.get('/users').then((r) => r.data),
    create: (data: object) => client.post('/users', data).then((r) => r.data),
    update: (id: string, data: object) => client.put(`/users/${id}`, data).then((r) => r.data),
    delete: (id: string) => client.delete(`/users/${id}`),
  },
  timeEntries: {
    list: (params?: object) => client.get('/time-entries', { params }).then((r) => r.data),
    create: (data: object) => client.post('/time-entries', data).then((r) => r.data),
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
    approve: (id: string) => client.patch(`/corrections/${id}/approve`).then((r) => r.data),
    reject: (id: string) => client.patch(`/corrections/${id}/reject`).then((r) => r.data),
  },
  projects: {
    list: () => client.get('/projects').then((r) => r.data),
    create: (data: object) => client.post('/projects', data).then((r) => r.data),
  },
  auditLogs: {
    list: (params?: object) => client.get('/audit-logs', { params }).then((r) => r.data),
  },
  exports: {
    timeEntries: (from: string, to: string) =>
      `${process.env.NEXT_PUBLIC_API_URL}/exports/time-entries/csv?from=${from}&to=${to}`,
    workerEntries: (from: string, to: string) =>
      `${process.env.NEXT_PUBLIC_API_URL}/exports/worker-entries/csv?from=${from}&to=${to}`,
  },
  contracts: {
  list: () => client.get('/contracts').then((r) => r.data),
  create: (data: object) => client.post('/contracts', data).then((r) => r.data),
  },
  activityTypes: {
  list: () => client.get('/activity-types').then((r) => r.data),
  },
  taskTypes: {
  list: () => client.get('/task-types').then((r) => r.data),
  },
};
