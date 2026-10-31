import { v4 as uuidv4 } from 'uuid';
import { redisClient } from './redis';
import { Task, CreateTaskInput, UpdateTaskInput, TaskStats, Priority, Status } from './types';

const TASKS_KEY = 'cloudpulse:tasks';
const ACTIVITY_KEY = 'cloudpulse:activity';

export async function getAllTasks(): Promise<Task[]> {
  const data = await redisClient.hgetall(TASKS_KEY);
  const tasks = Object.values(data).map((t) => JSON.parse(t as string) as Task);
  tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return tasks;
}

export async function getTaskById(id: string): Promise<Task | null> {
  const data = await redisClient.hget(TASKS_KEY, id);
  return data ? (JSON.parse(data) as Task) : null;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const now = new Date().toISOString();
  const task: Task = {
    id: uuidv4(),
    title: input.title.trim(),
    description: (input.description || '').trim(),
    priority: input.priority || 'medium',
    status: input.status || 'pending',
    dueDate: input.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    createdAt: now,
    updatedAt: now,
  };

  if (task.status === 'completed') {
    task.completedAt = now;
  }

  await redisClient.hset(TASKS_KEY, task.id, JSON.stringify(task));
  await addActivity(`Task "${task.title}" created`);
  return task;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
  const existing = await getTaskById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: Task = {
    ...existing,
    ...input,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: now,
  };

  if (input.status === 'completed' && existing.status !== 'completed') {
    updated.completedAt = now;
  } else if (input.status && input.status !== 'completed') {
    delete updated.completedAt;
  }

  await redisClient.hset(TASKS_KEY, id, JSON.stringify(updated));
  await addActivity(`Task "${updated.title}" updated`);
  return updated;
}

export async function deleteTask(id: string): Promise<boolean> {
  const existing = await getTaskById(id);
  if (!existing) return false;
  await redisClient.hdel(TASKS_KEY, id);
  await addActivity(`Task "${existing.title}" deleted`);
  return true;
}

export async function getTaskStats(): Promise<TaskStats> {
  const tasks = await getAllTasks();
  const now = new Date();
  const stats: TaskStats = {
    total: tasks.length,
    completed: 0,
    pending: 0,
    inProgress: 0,
    overdue: 0,
    byPriority: { low: 0, medium: 0, high: 0 },
  };

  for (const task of tasks) {
    if (task.status === 'completed') stats.completed++;
    else if (task.status === 'in-progress') stats.inProgress++;
    else stats.pending++;

    if (task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < now) {
      stats.overdue++;
    }

    stats.byPriority[task.priority]++;
  }

  return stats;
}

async function addActivity(message: string): Promise<void> {
  const entry = JSON.stringify({ message, timestamp: new Date().toISOString() });
  await redisClient.lpush(ACTIVITY_KEY, entry);
  await redisClient.ltrim(ACTIVITY_KEY, 0, 49);
}

export async function getRecentActivity(): Promise<Array<{ message: string; timestamp: string }>> {
  const items = await redisClient.lrange(ACTIVITY_KEY, 0, 19);
  return items.map((item: string) => JSON.parse(item));
}
