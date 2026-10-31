import React from 'react';
import { Edit2, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Task } from '../types';

interface TaskTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (task: Task) => void;
}

const priorityStyles: Record<string, string> = {
  high: 'bg-red-50 text-red-700',
  medium: 'bg-yellow-50 text-yellow-700',
  low: 'bg-green-50 text-green-700',
};

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 size={16} className="text-emerald-500" />,
  'in-progress': <Clock size={16} className="text-blue-500" />,
  pending: <AlertCircle size={16} className="text-amber-500" />,
};

const statusStyles: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700',
  'in-progress': 'bg-blue-50 text-blue-700',
  pending: 'bg-amber-50 text-amber-700',
};

export default function TaskTable({ tasks, onEdit, onDelete, onToggleComplete }: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <ListIcon />
        <p className="mt-3 text-lg font-medium">No tasks found</p>
        <p className="text-sm">Create a task or adjust your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
            <th className="pb-3 pl-4">Task</th>
            <th className="pb-3">Priority</th>
            <th className="pb-3">Status</th>
            <th className="pb-3">Due Date</th>
            <th className="pb-3 pr-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tasks.map((task) => {
            const isOverdue = task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < new Date();
            return (
              <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 pl-4 pr-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleComplete(task)}
                      className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-300 hover:border-indigo-400'
                      }`}
                    >
                      {task.status === 'completed' && <CheckCircle2 size={12} />}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{task.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className={`badge ${priorityStyles[task.priority]}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                </td>
                <td className="py-3">
                  <span className={`badge ${statusStyles[task.status]} inline-flex items-center gap-1`}>
                    {statusIcons[task.status]}
                    {task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </td>
                <td className="py-3">
                  <span className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                    {isOverdue && ' (overdue)'}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ListIcon() {
  return (
    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

