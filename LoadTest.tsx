import React, { useState, useRef } from 'react';
import { Zap, Play, Square, AlertTriangle } from 'lucide-react';
import { api } from '../api';

interface TestResult {
  timestamp: string;
  iterations: number;
  duration: number;
  success: boolean;
  error?: string;
}

export default function LoadTest() {
  const [running, setRunning] = useState(false);
  const [iterations, setIterations] = useState(100000);
  const [concurrentRequests, setConcurrentRequests] = useState(5);
  const [duration, setDuration] = useState(30);
  const [results, setResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const stopRef = useRef(false);

  const runTest = async () => {
    setRunning(true);
    stopRef.current = false;
    setProgress(0);
    const totalRequests = Math.ceil(duration * concurrentRequests);
    let completed = 0;

    const startTime = Date.now();

    for (let i = 0; i < totalRequests && !stopRef.current; i++) {
      try {
        const t0 = Date.now();
        await api.runLoadTest(iterations);
        const elapsed = Date.now() - t0;
        completed++;
        setProgress(Math.round((completed / totalRequests) * 100));
        setResults((prev) => [
          { timestamp: new Date().toISOString(), iterations, duration: elapsed, success: true },
          ...prev.slice(0, 99),
        ]);
      } catch (err: any) {
        setResults((prev) => [
          { timestamp: new Date().toISOString(), iterations, duration: 0, success: false, error: err.message },
          ...prev.slice(0, 99),
        ]);
      }

      if (Date.now() - startTime > duration * 1000) break;
    }

    setRunning(false);
  };

  const stopTest = () => {
    stopRef.current = true;
    setRunning(false);
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;
  const avgDuration = results.filter((r) => r.success).length > 0
    ? results.filter((r) => r.success).reduce((sum, r) => sum + r.duration, 0) / results.filter((r) => r.success).length
    : 0;

  return (
    <div className="space-y-6">
      <div className="card p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Safe In-App Load Tester</p>
            <p className="mt-0.5">This generates API requests to the backend's <code className="bg-amber-100 px-1 rounded">/api/load-test</code> endpoint. For production load testing, use external tools like <strong>Apache Bench</strong>, <strong>hey</strong>, or <strong>Locust</strong>. Monitor cloud costs during testing.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Zap size={16} className="text-indigo-600" /> Test Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">CPU Iterations per Request</label>
              <input
                type="number"
                value={iterations}
                onChange={(e) => setIterations(Math.min(Number(e.target.value) || 100000, 5000000))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                min={1000}
                max={5000000}
              />
              <p className="text-xs text-gray-400 mt-1">Higher values = more CPU per request</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Test Duration (seconds)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.min(Number(e.target.value) || 30, 300))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                min={5}
                max={300}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Sequential Requests</label>
              <input
                type="number"
                value={concurrentRequests}
                onChange={(e) => setConcurrentRequests(Math.min(Number(e.target.value) || 5, 50))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                min={1}
                max={50}
              />
            </div>
            <div className="pt-2">
              {running ? (
                <button onClick={stopTest} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition-colors">
                  <Square size={16} /> Stop Test
                </button>
              ) : (
                <button onClick={runTest} className="w-full flex items-center justify-center gap-2 btn-primary py-2.5">
                  <Play size={16} /> Start Test
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="lg:col-span-2 space-y-4">
          {running && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Test Progress</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{successCount}</p>
              <p className="text-xs text-gray-500 mt-1">Successful</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{failCount}</p>
              <p className="text-xs text-gray-500 mt-1">Failed</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{avgDuration > 0 ? `${avgDuration.toFixed(0)}ms` : '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Avg Latency</p>
            </div>
          </div>

          {/* Results Log */}
          <div className="card p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Request Log</h4>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {results.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Run a test to see results</p>
              ) : (
                results.slice(0, 50).map((r, i) => (
                  <div key={i} className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${r.success ? 'bg-gray-50' : 'bg-red-50'}`}>
                    <span className={r.success ? 'text-emerald-600' : 'text-red-600'}>
                      {r.success ? '✓' : '✗'} {new Date(r.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-gray-500">{r.success ? `${r.duration}ms` : r.error}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

