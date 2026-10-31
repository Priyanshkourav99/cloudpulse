import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Clock, AlertTriangle, Server, RefreshCw, Wifi } from 'lucide-react';
import { api } from '../api';
import { MonitoringData, HealthData } from '../types';

export default function Monitoring() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [m, h] = await Promise.all([api.getMonitoring(), api.getHealth()]);
      setData(m);
      setHealth(h);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Application-level metrics from the backend API</p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded text-indigo-600" />
            Auto-refresh (5s)
          </label>
          <button onClick={loadData} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="card p-4 bg-red-50 border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {data && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={<Activity size={20} className="text-indigo-600" />} label="Total Requests" value={data.requests.total.toLocaleString()} color="bg-indigo-50" />
            <MetricCard icon={<Clock size={20} className="text-blue-600" />} label="P95 Latency" value={`${data.latency.p95Ms.toFixed(1)} ms`} color="bg-blue-50" />
            <MetricCard icon={<AlertTriangle size={20} className="text-amber-600" />} label="Error Rate" value={`${data.errors.ratePercent}%`} color="bg-amber-50" />
            <MetricCard icon={<Server size={20} className="text-emerald-600" />} label="Uptime" value={formatUptime(data.uptime.seconds)} color="bg-emerald-50" />
          </div>

          {/* Detailed grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latency */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Response Latency</h3>
              <div className="space-y-3">
                <LatencyBar label="Average" value={data.latency.avgMs} max={Math.max(data.latency.p99Ms, 100)} color="bg-blue-500" />
                <LatencyBar label="P50 (Median)" value={data.latency.p50Ms} max={Math.max(data.latency.p99Ms, 100)} color="bg-indigo-500" />
                <LatencyBar label="P95" value={data.latency.p95Ms} max={Math.max(data.latency.p99Ms, 100)} color="bg-violet-500" />
                <LatencyBar label="P99" value={data.latency.p99Ms} max={Math.max(data.latency.p99Ms, 100)} color="bg-purple-500" />
              </div>
              <p className="text-xs text-gray-400 mt-3">{data.latency.sampleCount.toLocaleString()} samples collected</p>
            </div>

            {/* Requests by Status */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Requests by Status Code</h3>
              <div className="space-y-3">
                {Object.entries(data.requests.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${status === '2xx' ? 'bg-emerald-500' : status === '4xx' ? 'bg-amber-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-gray-700">{status}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count.toLocaleString()}</span>
                  </div>
                ))}
                {Object.keys(data.requests.byStatus).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No requests recorded yet</p>
                )}
              </div>
            </div>

            {/* Request Methods */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Requests by Method</h3>
              <div className="space-y-3">
                {Object.entries(data.requests.byMethod).map(([method, count]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className={`badge ${methodColor(method)}`}>{method}</span>
                    <span className="text-sm font-medium text-gray-900">{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Memory */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Memory Usage</h3>
              <div className="space-y-3">
                <MemoryRow label="RSS" bytes={data.memory.rss} />
                <MemoryRow label="Heap Used" bytes={data.memory.heapUsed} />
                <MemoryRow label="Heap Total" bytes={data.memory.heapTotal} />
              </div>
              <div className="mt-4 pt-3 border-t">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Wifi size={12} />
                  <span>CPU/container metrics available via Azure Monitor when deployed to AKS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Endpoints */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Top Endpoints</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase border-b">
                    <th className="pb-2">Endpoint</th>
                    <th className="pb-2 text-right">Requests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(data.requests.byPath)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([path, count]) => (
                      <tr key={path} className="hover:bg-gray-50">
                        <td className="py-2 font-mono text-xs text-gray-700">{path}</td>
                        <td className="py-2 text-right text-gray-900">{count.toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function LatencyBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value.toFixed(2)} ms</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MemoryRow({ label, bytes }: { label: string; bytes: number }) {
  const mb = (bytes / 1024 / 1024).toFixed(1);
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{mb} MB</span>
    </div>
  );
}

function methodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'bg-emerald-50 text-emerald-700',
    POST: 'bg-blue-50 text-blue-700',
    PUT: 'bg-amber-50 text-amber-700',
    DELETE: 'bg-red-50 text-red-700',
  };
  return colors[method] || 'bg-gray-50 text-gray-700';
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

