import { Task, TaskStats, MonitoringData, HealthData } from './types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getHealth: () => fetchAPI<HealthData>('/health'),
  getReady: () => fetchAPI<{ ready: boolean }>('/ready'),
  getTasks: (params?: { status?: string; priority?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return fetchAPI<{ tasks: Task[]; count: number }>(`/tasks${qs ? '?' + qs : ''}`);
  },
  getTask: (id: string) => fetchAPI<Task>(`/tasks/${id}`),
  createTask: (data: Partial<Task>) =>
    fetchAPI<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: Partial<Task>) =>
    fetchAPI<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id: string) =>
    fetchAPI<{ message: string }>(`/tasks/${id}`, { method: 'DELETE' }),
  getStats: () => fetchAPI<TaskStats>('/stats'),
  getMonitoring: () => fetchAPI<MonitoringData>('/monitoring'),
  getActivity: () => fetchAPI<Array<{ message: string; timestamp: string }>>('/activity'),
  runLoadTest: (iterations?: number) =>
    fetchAPI<{ result: string; iterations: number }>(`/load-test?iterations=${iterations || 100000}`),
};
