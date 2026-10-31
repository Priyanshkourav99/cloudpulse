# Azure Monitor Alert Rules & Action Group Configuration

This guide details how to configure alerts for **Task 3 & Task 4** of the assignment.

---

## 1. Create Action Group (Email Notification)

### Azure CLI:
```bash
RESOURCE_GROUP="cloudpulse-rg"
ACTION_GROUP_NAME="cloudpulse-actiongroup"
YOUR_EMAIL="your-student-email@college.edu"

az monitor action-group create \
  --resource-group $RESOURCE_GROUP \
  --name $ACTION_GROUP_NAME \
  --short-name "CPAlerts" \
  --action email "StudentDev" $YOUR_EMAIL
```

### Azure Portal Method:
1. Search **Monitor** in top search bar -> select **Alerts** -> click **Action groups**.
2. Click **+ Create**.
3. Group name: `cloudpulse-actiongroup`, Display name: `CPAlerts`.
4. Under **Notifications**, select `Email/SMS message/Push/Voice`.
5. Check `Email` and input your student email. Click **Review + Create**.

---

## 2. Alert Rule 1: High CPU Utilization (>75% for 5 minutes)

### Azure CLI:
```bash
AKS_RESOURCE_ID=$(az aks show --resource-group $RESOURCE_GROUP --name "cloudpulse-aks" --query id -o tsv)
ACTION_GROUP_ID=$(az monitor action-group show --resource-group $RESOURCE_GROUP --name $ACTION_GROUP_NAME --query id -o tsv)

az monitor metrics alert create \
  --name "Alert-CloudPulse-HighCPU" \
  --resource-group $RESOURCE_GROUP \
  --scopes $AKS_RESOURCE_ID \
  --condition "avg node cpu usage percentage > 75" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --severity 2 \
  --action $ACTION_GROUP_ID \
  --description "Pod or node average CPU exceeded 75% for more than 5 minutes."
```

### Azure Portal Method:
1. **Monitor** -> **Alerts** -> **+ Create** -> **Alert rule**.
2. **Scope**: Select your AKS cluster `cloudpulse-aks`.
3. **Condition**:
   - Signal: `CPU Usage Percentage`
   - Operator: `Greater than`
   - Threshold value: `75`
   - Unit: `%`
   - Aggregation type: `Average`
   - Aggregation granularity (Window): `5 minutes`
   - Frequency of evaluation: `1 minute`
4. **Actions**: Select `cloudpulse-actiongroup`.
5. **Details**:
   - Name: `Alert-CloudPulse-HighCPU`
   - Severity: `2 - Warning`
6. Click **Review + Create**.

---

## 3. Alert Rule 2: Pod Restarts (>3 in 10 minutes)

### Azure Portal Method:
1. **Monitor** -> **Alerts** -> **+ Create** -> **Alert rule**.
2. **Scope**: Select your Log Analytics Workspace `cloudpulse-law`.
3. **Condition**: Custom log search:
   ```kql
   KubePodInventory
   | where Namespace == "cloudpulse"
   | where PodRestartCount > 3
   | summarize RestartingPods = dcount(Name) by bin(TimeGenerated, 10m)
   | where RestartingPods > 0
   ```
4. **Measurement**:
   - Measure: `Table rows`
   - Operator: `Greater than 0`
   - Aggregation granularity: `10 minutes`
   - Frequency: `5 minutes`
5. **Actions**: Attach `cloudpulse-actiongroup`.
6. **Details**:
   - Name: `Alert-CloudPulse-PodRestarts`
   - Severity: `1 - Error`

---

## 4. Understanding Evaluation Windows & Latency (For Reflection Question #2)

- **Aggregation Granularity (Window)**: Azure Monitor aggregates observations across rolling 5-minute buckets (`avg(CPU) over 5m`).
- **Evaluation Frequency**: Azure Monitor runs the condition check every 1 minute.
- **Latency Cause**: If CPU spikes at 10:00:00 AM, the rolling average for the 5-minute window will not cross 75% immediately; it takes several evaluation cycles of sustained high usage to lift the window's arithmetic average above 75%. Once breached, notification dispatch takes an additional 1-2 minutes for email queuing.

