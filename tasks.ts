import { Router, Request, Response, NextFunction } from 'express';
import { getAllTasks, getTaskById, createTask, updateTask, deleteTask } from '../taskStore';
import { AppError } from '../middleware/errorHandler';
import { Priority, Status } from '../types';

export const taskRouter = Router();

const VALID_PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const VALID_STATUSES: Status[] = ['pending', 'in-progress', 'completed'];

taskRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let tasks = await getAllTasks();

    const { status, priority, search } = req.query;
    if (status && typeof status === 'string') {
      tasks = tasks.filter((t) => t.status === status);
    }
    if (priority && typeof priority === 'string') {
      tasks = tasks.filter((t) => t.priority === priority);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      tasks = tasks.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }

    res.json({ tasks, count: tasks.length });
  } catch (err) {
    next(err);
  }
});

taskRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await getTaskById(req.params.id);
    if (!task) throw new AppError('Task not found', 404);
    res.json(task);
  } catch (err) {
    next(err);
  }
});

taskRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, priority, status, dueDate } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new AppError('Title is required', 400);
    }
    if (title.trim().length > 200) {
      throw new AppError('Title must be 200 characters or less', 400);
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      throw new AppError(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`, 400);
    }
    if (status && !VALID_STATUSES.includes(status)) {
      throw new AppError(`Status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
    }

    const task = await createTask({ title, description, priority, status, dueDate });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

taskRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, priority, status, dueDate } = req.body;

    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      throw new AppError('Title cannot be empty', 400);
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      throw new AppError(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`, 400);
    }
    if (status && !VALID_STATUSES.includes(status)) {
      throw new AppError(`Status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
    }

    const task = await updateTask(req.params.id, { title, description, priority, status, dueDate });
    if (!task) throw new AppError('Task not found', 404);
    res.json(task);
  } catch (err) {
    next(err);
  }
});

taskRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await deleteTask(req.params.id);
    if (!deleted) throw new AppError('Task not found', 404);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
});
