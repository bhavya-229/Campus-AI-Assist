import React from 'react';
import {
  LayoutDashboard,
  BotMessageSquare,
  CalendarCheck2,
  ListTodo,
  CalendarDays,
  LifeBuoy,
  FileText,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assistant', label: 'AI Assistant', icon: BotMessageSquare, badge: 'Hybrid RAG' },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck2 },
    { id: 'assignments', label: 'Assignments', icon: ListTodo },
    { id: 'timetable', label: 'Timetable & Exams', icon: CalendarDays },
    { id: 'support', label: 'Support Tickets', icon: LifeBuoy },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Knowledge Base & Admin', icon: FileText, badge: 'Admin' });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-badge">
          <GraduationCap size={22} />
        </div>
        <div className="brand-info">
          <h1>Campus AI Assist</h1>
          <span>Academic Copilot</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="student-card">
          <div className="student-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="student-meta">
            <div className="student-name">{user?.name || 'Student'}</div>
            <div className="student-sub">
              {isAdmin ? 'Academic Admin' : `${user?.program || 'MCA'} • Sem ${user?.semester || '2'}`}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
