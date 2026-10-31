export type Priority = 'low' | 'medium' | 'high';
export type Status = 'pending' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  dueDate?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
  byPriority: { low: number; medium: number; high: number };
}

export interface MetricsData {
  httpRequestsTotal: number;
  httpRequestsByMethod: Record<string, number>;
  httpRequestsByStatus: Record<string, number>;
  httpRequestDurationMs: number[];
  errorsTotal: number;
  uptimeSeconds: number;
  startTime: string;
}
