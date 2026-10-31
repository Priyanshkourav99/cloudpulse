# CloudPulse Load Testing & Auto-Scaling Verification Guide

Follow this guide to execute **Task 4: Load Testing and Alerting** of your assignment.

---

## 1. Load Testing Overview

The goal is to generate controlled, high CPU traffic to the CloudPulse frontend service to:
1. Elevate CPU usage above the **50% HPA target**.
2. Observe HPA scale the pods from **1 to up to 5 replicas**.
3. Elevate CPU utilization above **75% for 5 minutes** to trigger the Azure Monitor email alert.
4. Keep execution strictly within **3 to 5 minutes** to prevent depleting free cloud credits.

---

## 2. Load Testing Endpoints

| Endpoint | Target Component | Purpose |
|----------|------------------|---------|
| `GET /api/load-test?iterations=1500000` | Backend API | Intensive mathematical floating-point workload (safe CPU stress) |
| `GET /api/tasks` | Backend & Redis | Normal database I/O testing |
| `GET /` | Frontend Nginx | Frontend web server traffic |

---

## 3. Preparation: Terminal Setup (Identity Verification Required)

Per assignment instructions, ensure your student verification header is visible:
```bash
echo "=== STUDENT IDENTITY VERIFICATION ===" && az account show --query "{Azure_Email: user.name, Subscription_ID: id}" -o table && echo "OS User: $(whoami) | Host: $(hostname) | Date: $(date)"
```

### Open 3 Terminal Windows:

- **Terminal 1 (Watch HPA Status)**:
  ```bash
  kubectl get hpa -n cloudpulse -w
  ```

- **Terminal 2 (Watch Pod Replicas)**:
  ```bash
  kubectl get pods -n cloudpulse -w
  ```

- **Terminal 3 (Execute Load Generator)**:
  Run one of the load options below.

---

## 4. Running the Load Test

### Option A: Using `hey` (Recommended)

```bash
# Get the external IP of frontend
FRONTEND_IP=$(kubectl get svc cloudpulse-frontend -n cloudpulse -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Run load test for 3.5 minutes (210s) with 30 concurrent workers
hey -z 210s -c 30 -q 10 "http://$FRONTEND_IP/api/load-test?iterations=1500000"
```

### Option B: Using Apache Bench (`ab`)

```bash
# 50,000 requests, concurrency of 35
ab -n 50000 -c 35 "http://$FRONTEND_IP/api/load-test?iterations=1500000"
```

### Option C: Using PowerShell Script (`load-test.ps1`)

```powershell
.\load-testing\load-test.ps1 -Endpoint "http://$FRONTEND_IP" -Duration 210 -Concurrency 25 -Iterations 1500000
```

### Option D: Using Bash Script (`load-test.sh`)

```bash
chmod +x ./load-testing/load-test.sh
./load-testing/load-test.sh "http://$FRONTEND_IP" 210 25
```

---

## 5. Capturing Required Assignment Evidence

Take screenshots of the following:

1. **Before Load Test**:
   - `kubectl get hpa -n cloudpulse` showing 1 replica and low CPU baseline (e.g. `1%/50%`).
   - `kubectl get pods -n cloudpulse` showing single running pod.

2. **During Load Test (Peak Load)**:
   - `kubectl get hpa -n cloudpulse -w` showing CPU utilization spike past 50% and scaling to 3-5 replicas.
   - `kubectl top pods -n cloudpulse` showing pod CPU usage.
   - Azure Monitor Dashboard showing CPU utilization spike.

3. **After Scale-Up / Alert**:
   - Azure Monitor Dashboard showing active replica count stepping up.
   - Email inbox showing the triggered alert email notification from Azure Monitor (`Alert-CloudPulse-HighCPU`).

