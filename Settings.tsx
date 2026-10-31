import React, { useEffect, useState } from 'react';
import { Info, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../api';
import { HealthData } from '../types';

export default function Settings() {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    api.getHealth().then(setHealth).catch(() => {});
  }, []);

  const apiUrl = import.meta.env.VITE_API_URL || '/api (proxied to localhost:3001)';
  const backendConnected = !!health;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Application Info */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Info size={16} className="text-indigo-600" /> Application Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Application', value: 'CloudPulse' },
            { label: 'Version', value: health?.version || '1.0.0' },
            { label: 'Environment', value: health?.environment || 'development' },
            { label: 'Backend Uptime', value: health ? `${Math.floor(health.uptime / 60)}m ${Math.floor(health.uptime % 60)}s` : '—' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-gray-500 uppercase tracking-wider">{item.label}</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Endpoint Status */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">API Endpoint Status</h3>
        <div className="space-y-3">
          <EndpointRow name="API Base URL" url={apiUrl} connected={backendConnected} />
          <EndpointRow name="Health Check" url="/api/health" connected={backendConnected} />
          <EndpointRow name="Readiness" url="/api/ready" connected={backendConnected} />
          <EndpointRow name="Metrics" url="/api/metrics" connected={backendConnected} />
          <EndpointRow name="Redis" url="Internal (not exposed)" connected={health?.services?.redis === 'connected'} />
        </div>
      </div>

      {/* Deployment Info */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Deployment Configuration</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-600">Frontend</span>
            <span className="text-gray-800 font-medium">React 18 + Vite + Tailwind CSS</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-600">Backend</span>
            <span className="text-gray-800 font-medium">Node.js + Express + TypeScript</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-600">Database</span>
            <span className="text-gray-800 font-medium">Redis (in-memory + persistence)</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-600">Containers</span>
            <span className="text-gray-800 font-medium">Docker + Docker Compose</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-600">Cloud Platform</span>
            <span className="text-gray-800 font-medium">Azure (AKS + ACR + Monitor)</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-gray-600">Orchestration</span>
            <span className="text-gray-800 font-medium">Kubernetes with HPA</span>
          </div>
        </div>
      </div>

      {/* Lab Info */}
      <div className="card p-6 bg-indigo-50/50 border-indigo-100">
        <h3 className="text-sm font-semibold text-indigo-800 mb-2">Cloud Computing Lab #2</h3>
        <p className="text-sm text-indigo-700">
          Containerized Task Management and Cloud Monitoring Platform — demonstrating Docker containerization, 
          Azure Kubernetes Service deployment, Horizontal Pod Autoscaling, and Azure Monitor integration.
        </p>
      </div>
    </div>
  );
}

function EndpointRow({ name, url, connected }: { name: string; url: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div>
        <span className="text-sm text-gray-700">{name}</span>
        <span className="text-xs text-gray-400 ml-2 font-mono">{url}</span>
      </div>
      {connected ? (
        <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 size={14} /> Connected</span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-red-500"><XCircle size={14} /> Disconnected</span>
      )}
    </div>
  );
}

