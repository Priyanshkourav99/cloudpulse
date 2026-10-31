# CloudPulse Metrics & Monitoring Guide

## Overview

CloudPulse uses a dual-layer observability architecture:
1. **Application-level telemetry** instrumented in Express.js backend (`/api/metrics` and `/api/monitoring`).
2. **Cluster & Platform telemetry** captured by Azure Kubernetes Service (AKS), Container Insights, and Azure Monitor Log Analytics.

---

## 1. Application-Level Metrics

### Prometheus-Compatible Endpoint: `GET /api/metrics`

| Metric Name | Type | Description |
|-------------|------|-------------|
| `http_requests_total` | Counter | Total number of HTTP requests handled by the backend |
| `http_request_duration_ms{quantile="0.5"}` | Summary | P50 (median) request duration in milliseconds |
| `http_request_duration_ms{quantile="0.95"}` | Summary | P95 request duration in milliseconds |
| `http_request_duration_ms{quantile="0.99"}` | Summary | P99 request duration in milliseconds |
| `http_request_duration_ms_avg` | Summary | Average request duration in milliseconds |
| `http_requests_by_method{method="..."}` | Counter | Total requests segmented by HTTP method (GET, POST, etc.) |
| `http_requests_by_status{status="..."}` | Counter | Total requests segmented by status code classes (2xx, 4xx, 5xx) |
| `http_errors_total` | Counter | Total count of 4xx and 5xx responses |
| `process_uptime_seconds` | Gauge | Backend process uptime in seconds |
| `nodejs_memory_usage_bytes{type="..."}` | Gauge | Memory footprints: RSS, heapTotal, heapUsed |

### Structured JSON Endpoint: `GET /api/monitoring`

Returns JSON for the CloudPulse dashboard UI:
```json
{
  "requests": {
    "total": 1420,
    "byMethod": { "GET": 1280, "POST": 140 },
    "byStatus": { "2xx": 1410, "4xx": 10 },
    "byPath": { "GET /api/tasks": 980, "POST /api/tasks": 140 }
  },
  "latency": {
    "p50Ms": 4.25,
    "p95Ms": 18.60,
    "p99Ms": 35.10,
    "avgMs": 6.80,
    "sampleCount": 1420
  },
  "errors": {
    "total": 10,
    "ratePercent": 0.70
  },
  "uptime": {
    "seconds": 3600,
    "startTime": "2026-10-30T10:00:00.000Z"
  },
  "memory": {
    "rss": 45100000,
    "heapUsed": 24300000,
    "heapTotal": 31200000
  }
}
```

---

## 2. Platform Telemetry (Azure Monitor & Container Insights)

| Metric | Source | Purpose |
|--------|--------|---------|
| **Pod CPU Utilization (%)** | Azure Monitor / Kubelet | Triggers HPA scaling (target: 50%) and alert rule (threshold: >75%) |
| **Pod Memory Working Set** | Azure Monitor | Detects memory leaks or potential OOMKills |
| **Active Pod Replicas** | Kubernetes API / Azure Monitor | Verifies HPA scaling from 1 up to 5 replicas under load |
| **Pod Restart Count** | KubePodInventory | Triggers pod restart alert (>3 restarts in 10 minutes) |

---

## 3. Telemetry Boundary & Responsibilities

- **Why application metrics?** Azure Monitor sees socket connections and container CPU/Memory, but cannot break down application-level P95 latency per route or application logical errors (like 400 Bad Request) without code instrumentation.
- **Why platform metrics?** Application code cannot measure true cgroup CPU throttling or kernel-level memory limits, nor can it scale out pods by itself. Kubernetes HPA relies on metrics-server/Azure Monitor platform data.

