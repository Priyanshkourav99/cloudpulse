import React from 'react';
import {
  LayoutDashboard, ListTodo, Activity, Zap, Server, Settings, X, Cloud
} from 'lucide-react';
import { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
  { page: 'tasks', label: 'Tasks', icon: <ListTodo size={20} /> },
  { page: 'monitoring', label: 'Monitoring', icon: <Activity size={20} /> },
  { page: 'loadtest', label: 'Load Testing', icon: <Zap size={20} /> },
  { page: 'infrastructure', label: 'Infrastructure', icon: <Server size={20} /> },
  { page: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

export default function Sidebar({ currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-navy-900 text-white flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Cloud size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">CloudPulse</h1>
              <p className="text-[10px] text-gray-400 -mt-0.5 uppercase tracking-widest">Task Platform</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150
                ${currentPage === item.page
                  ? 'bg-indigo-600/20 text-indigo-300'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="text-xs text-gray-500">
            <p>CloudPulse v1.0.0</p>
            <p className="mt-0.5">Cloud Computing Lab #2</p>
          </div>
        </div>
      </aside>
    </>
  );
}

