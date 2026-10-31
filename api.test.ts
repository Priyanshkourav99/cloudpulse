import app from '../src/app';
import http from 'http';

// Mock Redis
jest.mock('../src/redis', () => {
  const store: Record<string, Record<string, string>> = {};
  const lists: Record<string, string[]> = {};
  
  return {
    redisClient: {
      hgetall: jest.fn(async (key: string) => store[key] || {}),
      hget: jest.fn(async (key: string, field: string) => store[key]?.[field] || null),
      hset: jest.fn(async (key: string, field: string, value: string) => {
        if (!store[key]) store[key] = {};
        store[key][field] = value;
      }),
      hdel: jest.fn(async (key: string, field: string) => {
        if (store[key]) delete store[key][field];
      }),
      lpush: jest.fn(async (key: string, value: string) => {
        if (!lists[key]) lists[key] = [];
        lists[key].unshift(value);
      }),
      ltrim: jest.fn(async () => {}),
      lrange: jest.fn(async (key: string) => lists[key] || []),
      get: jest.fn(async () => null),
      set: jest.fn(async () => 'OK'),
      ping: jest.fn(async () => 'PONG'),
      quit: jest.fn(async () => {}),
    },
    connectRedis: jest.fn(async () => {}),
    isRedisReady: jest.fn(async () => true),
  };
});

function request(server: http.Server, method: string, path: string, body?: any): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const addr = server.address() as any;
    const options: http.RequestOptions = {
      hostname: 'localhost',
      port: addr.port,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 0, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('CloudPulse API', () => {
  let server: http.Server;

  beforeAll((done) => {
    server = app.listen(0, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  test('GET /api/health returns healthy status', async () => {
    const res = await request(server, 'GET', '/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.services.redis).toBe('connected');
  });

  test('GET /api/ready returns ready', async () => {
    const res = await request(server, 'GET', '/api/ready');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
  });

  test('POST /api/tasks creates a task', async () => {
    const res = await request(server, 'POST', '/api/tasks', {
      title: 'Test Task',
      description: 'Test description',
      priority: 'high',
    });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Task');
    expect(res.body.priority).toBe('high');
    expect(res.body.id).toBeDefined();
  });

  test('POST /api/tasks validates required title', async () => {
    const res = await request(server, 'POST', '/api/tasks', {});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Title is required');
  });

  test('POST /api/tasks validates priority', async () => {
    const res = await request(server, 'POST', '/api/tasks', {
      title: 'Test',
      priority: 'urgent',
    });
    expect(res.status).toBe(400);
  });

  test('GET /api/tasks returns task list', async () => {
    const res = await request(server, 'GET', '/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.tasks).toBeDefined();
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  test('GET /api/tasks/:id returns 404 for nonexistent task', async () => {
    const res = await request(server, 'GET', '/api/tasks/nonexistent-id');
    expect(res.status).toBe(404);
  });

  test('DELETE /api/tasks/:id returns 404 for nonexistent task', async () => {
    const res = await request(server, 'DELETE', '/api/tasks/nonexistent-id');
    expect(res.status).toBe(404);
  });

  test('GET /api/stats returns statistics', async () => {
    const res = await request(server, 'GET', '/api/stats');
    expect(res.status).toBe(200);
    expect(res.body.total).toBeDefined();
  });

  test('GET /api/metrics returns Prometheus metrics', async () => {
    const res = await request(server, 'GET', '/api/metrics');
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('string');
    expect(res.body).toContain('http_requests_total');
  });

  test('GET /api/monitoring returns monitoring data', async () => {
    const res = await request(server, 'GET', '/api/monitoring');
    expect(res.status).toBe(200);
    expect(res.body.requests).toBeDefined();
    expect(res.body.latency).toBeDefined();
  });
});
