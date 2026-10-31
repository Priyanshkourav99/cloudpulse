# CloudPulse System Architecture

## 1. Architectural Overview

CloudPulse is a cloud-native, microservices-based task management and autoscaling platform engineered for Azure Kubernetes Service (AKS).

```
                      +-----------------------------+
                      |       Web Browser           |
                      |   (User / Load Generator)   |
                      +--------------+--------------+
                                     |
                                     | HTTP / Port 80
                                     v
                      +-----------------------------+
                      | Kubernetes Service (Ingress)|
                      |    type: LoadBalancer       |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Frontend Pods (React)     |
                      |   Nginx Reverse Proxy       |
                      |  [HPA Auto-Scaled: 1 - 5]   |
                      +--------------+--------------+
                                     |
                                     | Internal Proxy (/api/*)
                                     v
                      +-----------------------------+
                      |  Backend ClusterIP Service  |
                      |    cloudpulse-backend:3001  |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Backend Pods (Express)    |
                      |   Node.js + TypeScript      |
                      |  [HPA Auto-Scaled: 1 - 5]   |
                      +--------------+--------------+
                                     |
                                     | Redis Protocol / Port 6379
                                     v
                      +-----------------------------+
                      |    Redis ClusterIP Service  |
                      |     cloudpulse-redis:6379   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |        Redis Pod            |
                      |  In-Memory + AOF Volume     |
                      +-----------------------------+
```

---

## 2. Component Specifications

### 2.1 Frontend Tier (`cloudpulse-frontend`)
- **Technology**: React 18, TypeScript, Tailwind CSS, Vite 5.
- **Serving**: Multi-stage build packaged with Nginx Alpine.
- **Nginx Role**: Serves pre-compiled Single Page Application (SPA) static assets and securely reverse-proxies `/api/` calls internally to the backend cluster IP service.
- **Scaling**: Autoscaled from 1 to 5 pods by Kubernetes HPA based on CPU utilization (>50%).
- **Resources**: Requests: `100m CPU`, `128Mi Memory`; Limits: `500m CPU`, `256Mi Memory`.

### 2.2 Backend Tier (`cloudpulse-backend`)
- **Technology**: Node.js 20, Express.js, TypeScript.
- **Responsibilities**: RESTful CRUD endpoints, task priority/status workflows, Prometheus metric collection middleware, and controlled CPU load emulation.
- **Endpoints**: `/api/health`, `/api/ready`, `/api/tasks`, `/api/stats`, `/api/metrics`, `/api/monitoring`, `/api/load-test`.
- **Resources**: Requests: `100m CPU`, `128Mi Memory`; Limits: `500m CPU`, `256Mi Memory`.

### 2.3 Data Store Tier (`cloudpulse-redis`)
- **Technology**: Redis 7 on Alpine.
- **Storage Strategy**: Fast in-memory hash indexing (`cloudpulse:tasks`) with Append Only File (`--appendonly yes`) persistence and LRU eviction policy.
- **Security Boundary**: Runs purely as an internal ClusterIP service without any external port mappings.

---

## 3. Telemetry and Alerting Pipeline

```
+------------------+         +------------------+         +--------------------+
|  Frontend Pods   |         |   Backend Pods   |         |    Redis Store     |
+--------+---------+         +--------+---------+         +---------+----------+
         |                            |                             |
         +----------------------------+-----------------------------+
                                      |
                           cgroup metrics (CPU/Memory)
                                      v
                      +--------------------------------+
                      |    AKS Kubelet / OMSAgent      |
                      +---------------+----------------+
                                      |
                          Metrics & Performance Data
                                      v
                      +--------------------------------+
                      |   Azure Container Insights     |
                      |    & Log Analytics Workspace   |
                      +---------------+----------------+
                                      |
                     +----------------+----------------+
                     |                                 |
                     v                                 v
        +--------------------------+     +--------------------------+
        | Azure Monitor Dashboard  |     | Azure Monitor Alerts     |
        | - CPU/Pod Utilization    |     | - CPU > 75% for 5m       |
        | - Memory Trends          |     | - Restarts > 3 in 10m    |
        | - P95 Latency / Requests |     +-------------+------------+
        | - Active Replica Count   |                   |
        +--------------------------+                   v
                                         +--------------------------+
                                         |   Action Group (Email)   |
                                         +--------------------------+
```

