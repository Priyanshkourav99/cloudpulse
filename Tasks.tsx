import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { api } from '../api';
import { Task, Priority, Status } from '../types';
import TaskTable from '../components/TaskTable';
import TaskForm from '../components/TaskForm';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      const data = await api.getTasks(params);
      setTasks(data.tasks);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterPriority]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreate = async (data: Partial<Task>) => {
    try {
      await api.createTask(data);
      setShowForm(false);
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleUpdate = async (data: Partial<Task>) => {
    if (!editingTask) return;
    try {
      await api.updateTask(editingTask.id, data);
      setEditingTask(null);
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to update task');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(id);
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const newStatus: Status = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTask(task.id, { status: newStatus });
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to update task');
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Task List */}
      <div className="card">
        {error ? (
          <div className="p-8 text-center text-red-500">
            <p>{error}</p>
            <button onClick={loadTasks} className="btn-secondary mt-3">Retry</button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <TaskTable
            tasks={tasks}
            onEdit={(task) => setEditingTask(task)}
            onDelete={handleDelete}
            onToggleComplete={handleToggleComplete}
          />
        )}
      </div>

      {/* Forms */}
      {showForm && <TaskForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />}
      {editingTask && <TaskForm task={editingTask} onSubmit={handleUpdate} onClose={() => setEditingTask(null)} />}
    </div>
  );
}

