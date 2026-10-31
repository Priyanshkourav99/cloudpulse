import express from 'express';
import cors from 'cors';
import { taskRouter } from './routes/tasks';
import { healthRouter } from './routes/health';
import { metricsRouter } from './routes/metrics';
import { monitoringRouter } from './routes/monitoring';
import { metricsMiddleware } from './middleware/metrics';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(metricsMiddleware);

app.use('/api', healthRouter);
app.use('/api/tasks', taskRouter);
app.use('/api', metricsRouter);
app.use('/api', monitoringRouter);

app.use(errorHandler);

export default app;
