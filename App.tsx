import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Monitoring from './pages/Monitoring';
import LoadTest from './pages/LoadTest';
import Infrastructure from './pages/Infrastructure';
import Settings from './pages/Settings';
import { Page } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />;
      case 'tasks': return <Tasks />;
      case 'monitoring': return <Monitoring />;
      case 'loadtest': return <LoadTest />;
      case 'infrastructure': return <Infrastructure />;
      case 'settings': return <Settings />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => { setCurrentPage(page); setSidebarOpen(false); }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} currentPage={currentPage} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
