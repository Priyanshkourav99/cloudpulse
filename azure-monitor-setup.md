# Azure Monitor & Log Analytics Setup Guide

Follow this guide to complete **Task 3: Cloud metrics monitoring config** of the assignment.

---

## 1. Prerequisites

- Active Azure Subscription.
- Azure CLI logged in with your student credentials:
  ```bash
  echo "=== STUDENT IDENTITY VERIFICATION ===" && az account show --query "{Azure_Email: user.name, Subscription_ID: id}" -o table && echo "OS User: $(whoami) | Host: $(hostname) | Date: $(date)"
  ```

---

## 2. Setting Up Log Analytics Workspace (Credit-Saving Configuration)

> [!TIP]
> **Free Account Ingestion Protection**: The legacy Free tier caps ingestion at 500 MB/day. Follow the assignment recommendation to restrict Data Collection Rules (DCR) to metrics and avoid logging excessive stdout/stderr.

```bash
# Set variables
RESOURCE_GROUP="cloudpulse-rg"
LOCATION="eastus"
WORKSPACE_NAME="cloudpulse-law"
CLUSTER_NAME="cloudpulse-aks"

# 1. Create Resource Group
az group create --name $RESOURCE_GROUP --location $LOCATION

# 2. Create Log Analytics Workspace
az monitor log-analytics workspace create \
  --resource-group $RESOURCE_GROUP \
  --workspace-name $WORKSPACE_NAME \
  --location $LOCATION

# 3. Retrieve Workspace ID
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group $RESOURCE_GROUP \
  --workspace-name $WORKSPACE_NAME \
  --query id -o tsv)
```

---

## 3. Enable Container Insights on AKS

### For New Cluster:
```bash
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $CLUSTER_NAME \
  --node-count 1 \
  --node-vm-size Standard_B2s \
  --enable-addons monitoring \
  --workspace-resource-id $WORKSPACE_ID \
  --generate-ssh-keys
```

### For Existing Cluster:
```bash
az aks enable-addons \
  --resource-group $RESOURCE_GROUP \
  --name $CLUSTER_NAME \
  --addons monitoring \
  --workspace-resource-id $WORKSPACE_ID
```

---

## 4. Azure Monitor Dashboard Setup

In the Azure Portal (`portal.azure.com`):
1. Navigate to **Dashboard** -> Click **+ Create** -> **Custom**.
2. Name the dashboard: `CloudPulse Production Monitoring`.
3. Add the following 4 required visualizations:

### Chart 1: Average CPU Utilization per Pod
- **Tile type**: Metrics Chart
- **Resource**: Your AKS Cluster (`cloudpulse-aks`)
- **Metric Namespace**: `Insights.container/pods`
- **Metric**: `Pod CPU utilization percentage`
- **Aggregation**: `Average`
- **Splitting**: Split by `podName`
- **Filter**: `namespace = cloudpulse`

### Chart 2: Memory Usage Trends Over Time
- **Tile type**: Metrics Chart
- **Resource**: Your AKS Cluster (`cloudpulse-aks`)
- **Metric Namespace**: `Insights.container/pods`
- **Metric**: `Pod Memory Working Set`
- **Aggregation**: `Average`
- **Splitting**: Split by `podName`
- **Filter**: `namespace = cloudpulse`

### Chart 3: Active Pod Replica Count
- **Tile type**: KQL Logs Query / Metric
- **KQL Query**:
  ```kql
  KubePodInventory
  | where Namespace == "cloudpulse"
  | where ControllerName contains "cloudpulse"
  | where PodStatus == "Running"
  | summarize ActiveReplicas = dcount(Name) by bin(TimeGenerated, 1m), ControllerName
  | render timechart
  ```

### Chart 4: Request Count & Response Latency (P95)
- **KQL Query**:
  ```kql
  Perf
  | where ObjectName == "K8SContainer"
  | where InstanceName contains "cloudpulse-backend" or InstanceName contains "cloudpulse-frontend"
  | where CounterName == "cpuUsageNanoCores"
  | summarize P95Usage = percentile(CounterValue, 95), AvgUsage = avg(CounterValue) by bin(TimeGenerated, 1m)
  | render timechart
  ```

