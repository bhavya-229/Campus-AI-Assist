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

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'assistant':
        return <Assistant />;
      case 'attendance':
        return <Attendance setActiveTab={setActiveTab} />;
      case 'assignments':
        return <Assignments setActiveTab={setActiveTab} />;
      case 'timetable':
        return <Timetable />;
      case 'support':
        return <Support />;
      case 'admin':
        return user?.role === 'admin' ? (
          <AdminKnowledge />
        ) : (
          <Dashboard setActiveTab={setActiveTab} />
        );
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Navbar activeTab={activeTab} onOpenChat={() => setActiveTab('assistant')} />
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
