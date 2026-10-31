import { Request, Response, NextFunction } from 'express';

interface MetricsBucket {
  httpRequestsTotal: number;
  httpRequestsByMethod: Record<string, number>;
  httpRequestsByStatus: Record<string, number>;
  httpRequestsByPath: Record<string, number>;
  httpRequestDurationMs: number[];
  errorsTotal: number;
  startTime: Date;
}

export const metrics: MetricsBucket = {
  httpRequestsTotal: 0,
  httpRequestsByMethod: {},
  httpRequestsByStatus: {},
  httpRequestsByPath: {},
  httpRequestDurationMs: [],
  errorsTotal: 0,
  startTime: new Date(),
};

const MAX_DURATION_SAMPLES = 10000;

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationMs = durationNs / 1e6;

    metrics.httpRequestsTotal++;
    metrics.httpRequestsByMethod[req.method] = (metrics.httpRequestsByMethod[req.method] || 0) + 1;
    
    const statusGroup = `${Math.floor(res.statusCode / 100)}xx`;
    metrics.httpRequestsByStatus[statusGroup] = (metrics.httpRequestsByStatus[statusGroup] || 0) + 1;

    const path = req.route?.path || req.path;
    const metricPath = `${req.method} ${path}`;
    metrics.httpRequestsByPath[metricPath] = (metrics.httpRequestsByPath[metricPath] || 0) + 1;

    metrics.httpRequestDurationMs.push(durationMs);
    if (metrics.httpRequestDurationMs.length > MAX_DURATION_SAMPLES) {
      metrics.httpRequestDurationMs.splice(0, metrics.httpRequestDurationMs.length - MAX_DURATION_SAMPLES);
    }

    if (res.statusCode >= 400) {
      metrics.errorsTotal++;
    }
  });

  next();
}
