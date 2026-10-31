import { redisClient } from './redis';
import { createTask } from './taskStore';

const SEED_KEY = 'cloudpulse:seeded';

const seedData = [
  { title: 'Configure AKS cluster networking', description: 'Set up virtual network, subnets, and network policies for the AKS cluster.', priority: 'high' as const, status: 'completed' as const, dueDate: '2026-10-25' },
  { title: 'Set up Azure Container Registry', description: 'Create ACR instance and configure access credentials for CI/CD pipeline.', priority: 'high' as const, status: 'completed' as const, dueDate: '2026-10-26' },
  { title: 'Deploy Redis to Kubernetes', description: 'Create Redis deployment with persistent volume claims and service configuration.', priority: 'medium' as const, status: 'in-progress' as const, dueDate: '2026-10-30' },
  { title: 'Implement HPA for frontend', description: 'Configure Horizontal Pod Autoscaler with CPU target 50% and 1-5 replicas.', priority: 'high' as const, status: 'pending' as const, dueDate: '2026-10-31' },
  { title: 'Configure Azure Monitor alerts', description: 'Set up CPU utilization and pod restart alerts with email notifications.', priority: 'medium' as const, status: 'pending' as const, dueDate: '2026-11-01' },
  { title: 'Write load testing scripts', description: 'Create Apache Bench and hey scripts for stress testing the application.', priority: 'low' as const, status: 'pending' as const, dueDate: '2026-11-02' },
  { title: 'Enable Container Insights', description: 'Enable Azure Monitor Container Insights and Log Analytics workspace.', priority: 'medium' as const, status: 'in-progress' as const, dueDate: '2026-10-29' },
  { title: 'Document deployment runbook', description: 'Write step-by-step deployment guide with troubleshooting section.', priority: 'low' as const, status: 'pending' as const, dueDate: '2026-11-05' },
  { title: 'Review Kubernetes RBAC policies', description: 'Audit role bindings and service accounts for security best practices.', priority: 'high' as const, status: 'pending' as const, dueDate: '2026-10-28' },
  { title: 'Optimize Docker image sizes', description: 'Use multi-stage builds and Alpine base images to reduce container sizes.', priority: 'low' as const, status: 'completed' as const, dueDate: '2026-10-24' },
];

export async function seedTasks(): Promise<void> {
  const alreadySeeded = await redisClient.get(SEED_KEY);
  if (alreadySeeded) {
    console.log('📦 Seed data already exists, skipping.');
    return;
  }

  console.log('🌱 Seeding demo tasks...');
  for (const task of seedData) {
    await createTask(task);
  }
  await redisClient.set(SEED_KEY, '1');
  console.log(`✅ Seeded ${seedData.length} tasks.`);
}
