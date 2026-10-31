import { Router, Request, Response } from 'express';
import { isRedisReady } from '../redis';
import { getTaskStats } from '../taskStore';
import { getRecentActivity } from '../taskStore';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  const redisOk = await isRedisReady();
  const status = redisOk ? 'healthy' : 'degraded';
  const statusCode = redisOk ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    uptime: process.uptime(),
    services: {
      redis: redisOk ? 'connected' : 'disconnected',
    },
    environment: process.env.NODE_ENV || 'development',
  });
});

healthRouter.get('/ready', async (_req: Request, res: Response) => {
  const redisOk = await isRedisReady();
  if (redisOk) {
    res.status(200).json({ ready: true, timestamp: new Date().toISOString() });
  } else {
    res.status(503).json({ ready: false, reason: 'Redis not available', timestamp: new Date().toISOString() });
  }
});

healthRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getTaskStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

healthRouter.get('/activity', async (_req: Request, res: Response) => {
  try {
    const activity = await getRecentActivity();
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});
