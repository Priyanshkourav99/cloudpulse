import React, { useEffect, useState } from 'react';
import { ListTodo, CheckCircle2, Clock, AlertTriangle, Activity, ArrowRight } from 'lucide-react';
import StatCard from '../components/StatCard';
import { api } from '../api';
import { TaskStats, HealthData, Page } from '../types';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [activity, setActivity] = useState<Array<{ message: string; timestamp: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, h, a] = await Promise.all([
        api.getStats(),
        api.getHealth(),
        api.getActivity(),
      ]);
      setStats(s);
      setHealth(h);
      setActivity(a);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <AlertTriangle className="mx-auto text-amber-500 mb-3" size={40} />
        <h3 className="text-lg font-semibold text-gray-800">Connection Error</h3>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
        <p className="text-xs text-gray-400 mt-2">Make sure the backend is running on port 3001</p>
        <button onClick={loadData} className="btn-primary mt-4">Retry</button>
      </div>
    );
  }

  const completionRate = stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tasks" value={stats?.total || 0} icon={<ListTodo size={20} className="text-indigo-600" />} color="bg-indigo-50" trend={`${completionRate}% completed`} />
        <StatCard title="Completed" value={stats?.completed || 0} icon={<CheckCircle2 size={20} className="text-emerald-600" />} color="bg-emerald-50" />
        <StatCard title="In Progress" value={stats?.inProgress || 0} icon={<Clock size={20} className="text-blue-600" />} color="bg-blue-50" />
        <StatCard title="Overdue" value={stats?.overdue || 0} icon={<AlertTriangle size={20} className="text-red-600" />} color="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Chart */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Task Distribution</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Pending', value: stats?.pending || 0, color: 'bg-amber-500', light: 'bg-amber-50 text-amber-700' },
              { label: 'In Progress', value: stats?.inProgress || 0, color: 'bg-blue-500', light: 'bg-blue-50 text-blue-700' },
              { label: 'Completed', value: stats?.completed || 0, color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${stats && stats.total > 0 ? (item.value / stats.total) * 100 : 0}, 100`} className={item.color.replace('bg-', 'text-')} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-800">{item.value}</span>
                </div>
                <span className={`badge ${item.light}`}>{item.label}</span>
              </div>
            ))}
          </div>
          {/* Priority bar */}
          <div className="mt-6">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">By Priority</h4>
            <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
              {stats && stats.total > 0 && (
                <>
                  <div className="bg-red-400 transition-all" style={{ width: `${(stats.byPriority.high / stats.total) * 100}%` }} title={`High: ${stats.byPriority.high}`} />
                  <div className="bg-yellow-400 transition-all" style={{ width: `${(stats.byPriority.medium / stats.total) * 100}%` }} title={`Medium: ${stats.byPriority.medium}`} />
                  <div className="bg-green-400 transition-all" style={{ width: `${(stats.byPriority.low / stats.total) * 100}%` }} title={`Low: ${stats.byPriority.low}`} />
                </>
              )}
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>High: {stats?.byPriority.high || 0}</span>
              <span>Medium: {stats?.byPriority.medium || 0}</span>
              <span>Low: {stats?.byPriority.low || 0}</span>
            </div>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          {/* API Status */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Service Health</h3>
            <div className="space-y-3">
              {[
                { name: 'Backend API', status: health?.status === 'healthy' },
                { name: 'Redis', status: health?.services.redis === 'connected' },
              ].map((svc) => (
                <div key={svc.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{svc.name}</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${svc.status ? 'text-emerald-600' : 'text-red-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${svc.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {svc.status ? 'Healthy' : 'Down'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t text-xs text-gray-400">
              <p>Version: {health?.version || '—'}</p>
              <p>Environment: {health?.environment || '—'}</p>
              <p>Uptime: {health ? `${Math.floor(health.uptime / 60)}m ${Math.floor(health.uptime % 60)}s` : '—'}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => onNavigate('tasks')} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600 transition-colors group">
                Manage Tasks <ArrowRight size={14} className="text-gray-300 group-hover:text-indigo-500" />
              </button>
              <button onClick={() => onNavigate('monitoring')} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600 transition-colors group">
                View Monitoring <ArrowRight size={14} className="text-gray-300 group-hover:text-indigo-500" />
              </button>
              <button onClick={() => onNavigate('loadtest')} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600 transition-colors group">
                Run Load Test <ArrowRight size={14} className="text-gray-300 group-hover:text-indigo-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
          <Activity size={16} className="text-gray-400" />
        </div>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activity.slice(0, 8).map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700">{item.message}</p>
                  <p className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

