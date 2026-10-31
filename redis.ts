import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

// In-memory fallback store when Redis is not running locally
class InMemoryRedisFallback {
  private hashes: Map<string, Map<string, string>> = new Map();
  private lists: Map<string, string[]> = new Map();
  private strings: Map<string, string> = new Map();

  async hgetall(key: string): Promise<Record<string, string>> {
    const map = this.hashes.get(key);
    if (!map) return {};
    const obj: Record<string, string> = {};
    map.forEach((val, k) => { obj[k] = val; });
    return obj;
  }

  async hget(key: string, field: string): Promise<string | null> {
    const map = this.hashes.get(key);
    return map?.get(field) ?? null;
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    if (!this.hashes.has(key)) {
      this.hashes.set(key, new Map());
    }
    this.hashes.get(key)!.set(field, value);
    return 1;
  }

  async hdel(key: string, field: string): Promise<number> {
    const map = this.hashes.get(key);
    if (!map) return 0;
    return map.delete(field) ? 1 : 0;
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    if (!this.lists.has(key)) {
      this.lists.set(key, []);
    }
    const list = this.lists.get(key)!;
    for (const val of values) {
      list.unshift(val);
    }
    return list.length;
  }

  async ltrim(key: string, start: number, stop: number): Promise<'OK'> {
    const list = this.lists.get(key);
    if (list) {
      this.lists.set(key, list.slice(start, stop < 0 ? undefined : stop + 1));
    }
    return 'OK';
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.lists.get(key);
    if (!list) return [];
    return list.slice(start, stop < 0 ? undefined : stop + 1);
  }

  async get(key: string): Promise<string | null> {
    return this.strings.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.strings.set(key, value);
    return 'OK';
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async quit(): Promise<'OK'> {
    return 'OK';
  }
}

let activeClient: any;
let isUsingFallback = false;

const realRedis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
  retryStrategy: () => null, // don't hang if offline locally
  lazyConnect: true,
});

activeClient = realRedis;

export const redisClient = new Proxy({} as any, {
  get(_target, prop) {
    if (isUsingFallback) {
      return (activeClient as any)[prop]?.bind(activeClient);
    }
    return (realRedis as any)[prop]?.bind(realRedis);
  },
});

export async function connectRedis(): Promise<void> {
  try {
    await realRedis.connect();
    console.log(`Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
  } catch (err: any) {
    console.warn(`Could not connect to Redis (${err.message}). Activating in-memory store fallback for local execution.`);
    isUsingFallback = true;
    activeClient = new InMemoryRedisFallback();
  }
}

export async function isRedisReady(): Promise<boolean> {
  try {
    if (isUsingFallback) return true;
    const pong = await realRedis.ping();
    return pong === 'PONG';
  } catch {
    return isUsingFallback;
  }
}
