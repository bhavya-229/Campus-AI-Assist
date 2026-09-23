import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assistant from './pages/Assistant';
import Attendance from './pages/Attendance';
import Assignments from './pages/Assignments';
import Timetable from './pages/Timetable';
import Support from './pages/Support';
import AdminKnowledge from './pages/AdminKnowledge';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshCount, setRefreshCount] = useState(0);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setRefreshCount((prev) => prev + 1);
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={handleTabChange} refreshKey={refreshCount} />;
      case 'assistant':
        return <Assistant />;
      case 'attendance':
        return <Attendance setActiveTab={handleTabChange} refreshKey={refreshCount} />;
      case 'assignments':
        return <Assignments setActiveTab={handleTabChange} refreshKey={refreshCount} />;
      case 'timetable':
        return <Timetable refreshKey={refreshCount} />;
      case 'support':
        return <Support refreshKey={refreshCount} />;
      case 'admin':
        return user?.role === 'admin' ? (
          <AdminKnowledge refreshKey={refreshCount} />
        ) : (
          <Dashboard setActiveTab={handleTabChange} refreshKey={refreshCount} />
        );
      default:
        return <Dashboard setActiveTab={handleTabChange} refreshKey={refreshCount} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      <div className="main-content">
        <Navbar activeTab={activeTab} onOpenChat={() => handleTabChange('assistant')} />
        {renderActivePage()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
