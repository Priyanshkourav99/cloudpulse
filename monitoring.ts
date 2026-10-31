import { Router, Request, Response } from 'express';
import { metrics } from '../middleware/metrics';

export const monitoringRouter = Router();

monitoringRouter.get('/monitoring', (_req: Request, res: Response) => {
  const uptimeSeconds = (Date.now() - metrics.startTime.getTime()) / 1000;
  const durations = metrics.httpRequestDurationMs;
  
  let p50 = 0, p95 = 0, p99 = 0, avg = 0;
  if (durations.length > 0) {
    const sorted = [...durations].sort((a, b) => a - b);
    p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  const errorRate = metrics.httpRequestsTotal > 0
    ? ((metrics.errorsTotal / metrics.httpRequestsTotal) * 100).toFixed(2)
    : '0.00';

  res.json({
    requests: {
      total: metrics.httpRequestsTotal,
      byMethod: metrics.httpRequestsByMethod,
      byStatus: metrics.httpRequestsByStatus,
      byPath: metrics.httpRequestsByPath,
    },
    latency: {
      p50Ms: parseFloat(p50.toFixed(2)),
      p95Ms: parseFloat(p95.toFixed(2)),
      p99Ms: parseFloat(p99.toFixed(2)),
      avgMs: parseFloat(avg.toFixed(2)),
      sampleCount: durations.length,
    },
    errors: {
      total: metrics.errorsTotal,
      ratePercent: parseFloat(errorRate),
    },
    uptime: {
      seconds: parseFloat(uptimeSeconds.toFixed(0)),
      startTime: metrics.startTime.toISOString(),
    },
    memory: {
      rss: process.memoryUsage().rss,
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
    },
  });
});

// Load test endpoint — generates CPU work
monitoringRouter.get('/load-test', (_req: Request, res: Response) => {
  const iterations = parseInt((_req.query.iterations as string) || '100000', 10);
  const capped = Math.min(iterations, 5000000);
  let result = 0;
  for (let i = 0; i < capped; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }
  res.json({ result: result.toFixed(4), iterations: capped, timestamp: new Date().toISOString() });
});
