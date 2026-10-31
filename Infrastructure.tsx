import React, { useEffect, useState } from 'react';
import { Server, Database, Container, Cloud, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../api';
import { HealthData } from '../types';

export default function Infrastructure() {
  const [health, setHealth] = useState<HealthData | null>(null);

  const loadData = async () => {
    try {
      const h = await api.getHealth();
      setHealth(h);
    } catch {
      // Error handled by status indicator
    }
  };

  useEffect(() => { loadData(); }, []);

  const services = [
    { name: 'Frontend (React)', status: true, type: 'container', details: 'Vite + React 18 + TypeScript', port: '3000' },
    { name: 'Backend API (Express)', status: health?.status === 'healthy', type: 'container', details: 'Node.js + Express + TypeScript', port: '3001' },
    { name: 'Redis', status: health?.services?.redis === 'connected', type: 'database', details: 'In-memory data store', port: '6379' },
  ];

  const k8sResources = [
    { resource: 'Namespace', name: 'cloudpulse', status: 'configured' },
    { resource: 'Frontend Deployment', name: 'cloudpulse-frontend', status: 'configured' },
    { resource: 'Backend Deployment', name: 'cloudpulse-backend', status: 'configured' },
    { resource: 'Redis Deployment', name: 'cloudpulse-redis', status: 'configured' },
    { resource: 'Frontend HPA', name: 'cloudpulse-frontend-hpa', status: 'configured' },
    { resource: 'Backend HPA', name: 'cloudpulse-backend-hpa', status: 'configured' },
    { resource: 'Frontend Service', name: 'LoadBalancer :80', status: 'configured' },
    { resource: 'Backend Service', name: 'ClusterIP :3001', status: 'configured' },
    { resource: 'Redis Service', name: 'ClusterIP :6379', status: 'configured' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Service health and infrastructure configuration</p>
        <button onClick={loadData} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((svc) => (
          <div key={svc.name} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {svc.type === 'container' ? <Container size={20} className="text-indigo-500" /> : <Database size={20} className="text-emerald-500" />}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">{svc.name}</h4>
                  <p className="text-xs text-gray-400">{svc.details}</p>
                </div>
              </div>
              {svc.status ? (
                <CheckCircle2 size={18} className="text-emerald-500" />
              ) : (
                <XCircle size={18} className="text-red-500" />
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Port: {svc.port}</span>
              <span className={`badge ${svc.status ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {svc.status ? 'Running' : 'Unavailable'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Kubernetes Resources */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cloud size={18} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-800">Kubernetes Resources</h3>
          <span className="badge bg-blue-50 text-blue-700 ml-2">Manifests configured</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b">
                <th className="pb-2">Resource Type</th>
                <th className="pb-2">Name / Config</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {k8sResources.map((r) => (
                <tr key={r.resource} className="hover:bg-gray-50">
                  <td className="py-2.5 text-gray-700">{r.resource}</td>
                  <td className="py-2.5 font-mono text-xs text-gray-500">{r.name}</td>
                  <td className="py-2.5 text-right">
                    <span className="badge bg-emerald-50 text-emerald-700">Manifest Ready</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Docker Environment */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Docker Compose Environment</h3>
        <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-x-auto">
          <pre>{`# Start all services
docker compose up -d --build

# Check logs
docker compose logs -f

# Stop services
docker compose down

# Check container status
docker compose ps`}</pre>
        </div>
      </div>
    </div>
  );
}

