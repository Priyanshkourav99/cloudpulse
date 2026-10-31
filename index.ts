import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { redisClient, connectRedis } from './redis';
import { seedTasks } from './seed';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  try {
    await connectRedis();
    console.log('✅ Connected to Redis');
    
    await seedTasks();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 CloudPulse Backend running on port ${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/api/health`);
      console.log(`📈 Metrics: http://localhost:${PORT}/api/metrics`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await redisClient.quit();
        console.log('Server closed.');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
