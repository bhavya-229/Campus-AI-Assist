import React from 'react';
import { LogOut, UserCircle, Sparkles, ShieldCheck, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ activeTab, onOpenChat }) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Student Overview', subtitle: 'Academic performance and today’s schedule' };
      case 'assistant':
        return { title: 'Campus AI Assistant', subtitle: 'Context-aware RAG copilot with Qdrant + Llama 3.2' };
      case 'attendance':
        return { title: 'Attendance Tracker', subtitle: 'Course-wise attendance and 75% eligibility status' };
      case 'assignments':
        return { title: 'Assignment Manager', subtitle: 'Track deadlines, course submissions, and tasks' };
      case 'timetable':
        return { title: 'Timetable & Exam Schedule', subtitle: 'Weekly classes and upcoming examination calendar' };
      case 'support':
        return { title: 'Campus Support Services', subtitle: 'Raise and track ID, exam, IT, or hostel issues' };
      case 'admin':
        return { title: 'Knowledge Base & Admin Hub', subtitle: 'Ingest policy PDFs, manage index, and tickets' };
      default:
        return { title: 'Campus AI Assist', subtitle: 'Academic Portal' };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <header className="top-header">
      <div className="header-title-area">
        <h2>{pageInfo.title}</h2>
        <p>{pageInfo.subtitle}</p>
      </div>

      <div className="header-actions">
        {isAdmin ? (
          <div className="role-pill admin">
            <ShieldCheck size={14} />
            <span>Admin Mode</span>
          </div>
        ) : (
          <div className="role-pill student">
            <Database size={14} />
            <span>{user?.student_id || 'MCA2025-042'}</span>
          </div>
        )}

        <button className="btn-secondary" onClick={logout} title="Sign Out">
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
