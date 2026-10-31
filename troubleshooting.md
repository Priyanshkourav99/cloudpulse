# CloudPulse Troubleshooting & Diagnostic Guide

This document lists solutions to common errors encountered during local execution and AKS deployment.

---

## 1. Local Development & Docker Compose

### Error: Redis Connection Refused on Local Run
- **Cause**: Redis container is not running or port 6379 is occupied.
- **Fix**:
  ```bash
  docker compose up -d redis
  docker compose ps
  ```

### Error: Frontend displays "Connection Error" on Dashboard
- **Cause**: Backend container is starting or degraded.
- **Fix**: Check backend health endpoint directly:
  ```bash
  curl http://localhost:3001/api/health
  docker compose logs backend
  ```

---

## 2. Azure Container Registry (ACR) & Image Push

### Error: `ImagePullBackOff` or `ErrImagePull` on AKS
- **Cause**: AKS does not have pull permissions on your ACR.
- **Fix**: Attach ACR to the AKS cluster using Azure CLI:
  ```bash
  az aks update --name cloudpulse-aks --resource-group cloudpulse-rg --attach-acr <ACR_NAME>
  ```

### Verify Images in ACR:
```bash
az acr repository list --name <ACR_NAME> --output table
az acr repository show-tags --name <ACR_NAME> --repository cloudpulse-frontend --output table
```

---

## 3. Kubernetes Deployment & HPA

### Error: HPA shows `<unknown>/50%` under TARGETS
- **Cause 1**: The pods were just scheduled; metrics-server takes ~60-90 seconds to collect its first sample.
- **Cause 2**: Missing `resources.requests.cpu` in pod spec. HPA requires CPU requests to calculate percentage.
- **Diagnostic Command**:
  ```bash
  kubectl describe hpa -n cloudpulse
  kubectl top pods -n cloudpulse
  ```
- If metrics-server is missing on a custom cluster:
  ```bash
  kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
  ```

### Error: Service External-IP stays `<pending>`
- **Cause**: Azure LoadBalancer provisioning in progress (normal for 1-3 minutes).
- **Diagnostic Command**:
  ```bash
  kubectl describe svc cloudpulse-frontend -n cloudpulse
  ```

---

## 4. Azure Monitor & Credit Protection

### Ensuring Free Tier Limits are Respected:
1. Limit load generation to **3 to 5 minutes** max.
2. In Azure Log Analytics, ensure the daily ingestion cap is set to 0.5 GB:
   ```bash
   az monitor log-analytics workspace update \
     --resource-group cloudpulse-rg \
     --workspace-name cloudpulse-law \
     --quota 0.5
   ```
3. After completing the lab and saving screenshots, delete the resource group:
   ```bash
   az group delete --name cloudpulse-rg --yes --no-wait
   ```

