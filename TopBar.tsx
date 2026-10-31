import React from 'react';
import { Menu, Bell, RefreshCw } from 'lucide-react';
import { Page } from '../types';

const pageTitles: Record<Page, string> = {
  dashboard: 'Overview Dashboard',
  tasks: 'Task Management',
  monitoring: 'Cloud Monitoring',
  loadtest: 'Load Testing',
  infrastructure: 'Infrastructure Status',
  settings: 'Settings',
};

interface TopBarProps {
  onMenuClick: () => void;
  currentPage: Page;
}

export default function TopBar({ onMenuClick, currentPage }: TopBarProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">{pageTitles[currentPage]}</h2>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.location.reload()}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold ml-2">
          CP
        </div>
      </div>
    </header>
  );
}

